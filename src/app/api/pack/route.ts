import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { client } from "@/sanity/client";
import { ALL_CLOTHING_QUERY } from "@/sanity/lib/queries";
import { STYLE_GUIDE } from "@/lib/styleGuide";

const anthropic = new Anthropic();

// Map month to seasons for pre-filtering
function monthToSeasons(month?: string): string[] {
  const map: Record<string, string[]> = {
    January: ["winter"],
    February: ["winter"],
    March: ["spring", "winter"],
    April: ["spring"],
    May: ["spring", "summer"],
    June: ["summer"],
    July: ["summer"],
    August: ["summer"],
    September: ["fall", "summer"],
    October: ["fall"],
    November: ["fall", "winter"],
    December: ["winter"],
  };
  return month ? map[month] || [] : [];
}

// Pick a diverse subset: ensure coverage across categories
function selectDiverseSubset(items: any[], targetCount: number): any[] {
  const byCategory = new Map<string, any[]>();
  for (const item of items) {
    const cat = item.category || "other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }

  // Shuffle each category
  for (const [, arr] of byCategory) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const selected: any[] = [];
  const categories = [...byCategory.keys()];
  let round = 0;

  while (selected.length < targetCount) {
    let addedAny = false;
    for (const cat of categories) {
      const arr = byCategory.get(cat)!;
      if (round < arr.length && selected.length < targetCount) {
        selected.push(arr[round]);
        addedAny = true;
      }
    }
    if (!addedAny) break;
    round++;
  }

  return selected;
}

export async function POST(request: NextRequest) {
  try {
    const { destination, days, month, vibe } = await request.json();

    if (!destination || !days) {
      return NextResponse.json(
        { error: "Destination and number of days are required" },
        { status: 400 }
      );
    }

    const allItems = await client.fetch(ALL_CLOTHING_QUERY);

    if (!allItems.length) {
      return NextResponse.json(
        { error: "No clothing items in inventory." },
        { status: 404 }
      );
    }

    // Pre-filter by season if month is provided
    const seasons = monthToSeasons(month);
    let filtered = allItems;
    if (seasons.length > 0) {
      const seasonMatched = allItems.filter(
        (item: any) =>
          item.season?.some((s: string) => seasons.includes(s)) ||
          item.category === "accessories"
      );
      // Only use season filter if it leaves us enough items
      if (seasonMatched.length >= 30) {
        filtered = seasonMatched;
      }
    }

    // Select a diverse subset to keep the prompt manageable
    // ~6 items per outfit slot (daytime + evening) × days, with some extras
    const targetItems = Math.min(filtered.length, Math.max(60, days * 15));
    const items = selectDiverseSubset(filtered, targetItems);

    const inventory = items.map((item: any) => ({
      id: item._id,
      name: item.name,
      category: item.category,
      color: item.color,
      season: item.season,
      occasions: item.occasions,
      description: item.description,
    }));

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      messages: [
        {
          role: "user",
          content: `You are a personal stylist for MAISON, an upscale fashion brand. A customer needs you to pack outfits for their trip.

${STYLE_GUIDE}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${days} days
- Month of travel: ${month || "not specified"}
- Vibe/Style: ${vibe || "versatile and stylish"}

Use your knowledge of typical weather in ${destination} during ${month || "this time of year"} to recommend weather-appropriate outfits. Consider temperature, humidity, rain likelihood, and indoor/outdoor activities typical for that destination and season.

AVAILABLE INVENTORY (${inventory.length} curated pieces, JSON):
${JSON.stringify(inventory, null, 2)}

Create a packing plan with outfits for each day. Each day should have a DAYTIME outfit and an EVENING outfit.
You MUST select real items from the inventory using their exact IDs.
You MUST always include a bag/purse from the accessories category in every outfit.
Try to mix and match pieces across days where it makes sense (e.g. reusing a great pair of shoes or a versatile jacket) but keep each outfit feeling fresh.

Respond in this exact JSON format (no markdown, no code fences):
{
  "tripName": "A creative name for this packing plan",
  "packingTips": "2-3 sentences of general packing advice for this trip",
  "days": [
    {
      "dayNumber": 1,
      "dayTitle": "Creative title for the day",
      "daytime": {
        "outfitName": "Name for daytime look",
        "selectedItems": ["id1", "id2"],
        "description": "1-2 sentences about this daytime look"
      },
      "evening": {
        "outfitName": "Name for evening look",
        "selectedItems": ["id3", "id4"],
        "description": "1-2 sentences about this evening look"
      }
    }
  ]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const packingPlan = JSON.parse(content.text);

    // Resolve item IDs to full item objects (from ALL items, not just the subset)
    const itemMap = new Map(allItems.map((item: any) => [item._id, item]));

    packingPlan.days = packingPlan.days.map((day: any) => ({
      ...day,
      daytime: {
        ...day.daytime,
        items: day.daytime.selectedItems
          .map((id: string) => itemMap.get(id))
          .filter(Boolean),
      },
      evening: {
        ...day.evening,
        items: day.evening.selectedItems
          .map((id: string) => itemMap.get(id))
          .filter(Boolean),
      },
    }));

    return NextResponse.json(packingPlan);
  } catch (error: any) {
    console.error("Packing error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to generate packing plan" },
      { status: 500 }
    );
  }
}
