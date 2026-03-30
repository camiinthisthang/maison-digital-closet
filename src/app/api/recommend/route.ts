import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { client } from "@/sanity/client";
import { ALL_CLOTHING_QUERY, CURATED_OUTFITS_QUERY } from "@/sanity/lib/queries";
import { STYLE_GUIDE } from "@/lib/styleGuide";
import { urlFor } from "@/sanity/image";
import fs from "fs";
import path from "path";

const anthropic = new Anthropic();

// Load inspo images once at startup
let inspoImagesCache: { base64: string; mediaType: string }[] | null = null;

function loadInspoImages(): { base64: string; mediaType: string }[] {
  if (inspoImagesCache) return inspoImagesCache;

  const inspoDir = path.join(process.cwd(), "src", "inspo");
  if (!fs.existsSync(inspoDir)) return [];

  const files = fs.readdirSync(inspoDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  // Pick up to 6 random inspo images to keep token usage reasonable
  const shuffled = files.sort(() => Math.random() - 0.5).slice(0, 6);

  inspoImagesCache = shuffled.map(file => {
    const data = fs.readFileSync(path.join(inspoDir, file));
    const ext = path.extname(file).toLowerCase();
    const mediaType = ext === ".png" ? "image/png" : "image/jpeg";
    return { base64: data.toString("base64"), mediaType };
  });

  return inspoImagesCache;
}

// Fetch image as base64 for vision API
async function imageToBase64(imageRef: any): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const imageUrl = urlFor(imageRef).width(512).quality(70).url();
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return { base64, mediaType: contentType };
  } catch {
    return null;
  }
}

function selectDiverseSubset(allItems: any[], limit: number) {
  if (allItems.length <= limit) return allItems;

  const byCategory = new Map<string, any[]>();
  for (const item of allItems) {
    const cat = item.category || "other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }
  for (const [, arr] of byCategory) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  const selected: any[] = [];
  const categories = [...byCategory.keys()];
  let round = 0;
  while (selected.length < limit) {
    let addedAny = false;
    for (const cat of categories) {
      const arr = byCategory.get(cat)!;
      if (round < arr.length && selected.length < limit) {
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
    const { eventDescription } = await request.json();

    if (!eventDescription) {
      return NextResponse.json(
        { error: "Event description is required" },
        { status: 400 }
      );
    }

    const [allItems, curatedOutfits] = await Promise.all([
      client.fetch(ALL_CLOTHING_QUERY),
      client.fetch(CURATED_OUTFITS_QUERY),
    ]);

    if (!allItems.length) {
      return NextResponse.json(
        { error: "No clothing items in inventory. Add items via /studio first." },
        { status: 404 }
      );
    }

    const items = selectDiverseSubset(allItems, 80);

    const inventory = items.map((item: any) => ({
      id: item._id,
      name: item.name,
      category: item.category,
      color: item.color,
      season: item.season,
      occasions: item.occasions,
      description: item.description,
    }));

    // Build curated outfits reference
    let curatedContext = "";
    if (curatedOutfits && curatedOutfits.length > 0) {
      const outfitDescriptions = curatedOutfits.map((outfit: any) => {
        const pieces = outfit.items
          ?.map((item: any) => `${item.name} (${item.category}, ${item.color})`)
          .join(" + ");
        return `• "${outfit.name}" [${outfit.occasion}]: ${pieces}${outfit.notes ? ` — Curator note: ${outfit.notes}` : ""}`;
      }).join("\n");

      curatedContext = `
CURATED OUTFIT REFERENCE — These are outfits hand-picked by the client's stylish friends.
Your recommendations MUST match the taste, color coordination, and styling patterns shown here.
Study these carefully — they define what "good" looks like for this client:

${outfitDescriptions}

KEY PATTERNS TO FOLLOW from these curated outfits:
- Match the color coordination style (notice which colors are paired together)
- Match the proportion play (oversized + fitted, etc.)
- Match the formality calibration (how dressed up vs casual for each occasion)
- If recommending for an occasion that has curated examples, use those as direct templates
`;
    }

    const MAX_ATTEMPTS = 3;
    let lastRecommendation = null;
    let lastItems: any[] = [];
    let vibeCheckFeedback = "";

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Step 1: Pick outfit from structured data
      const pickPrompt = attempt === 0
        ? `You are a personal stylist for MAISON, an upscale fashion brand. A customer needs an outfit recommendation.

${STYLE_GUIDE}
${curatedContext}

EVENT DESCRIPTION: "${eventDescription}"

AVAILABLE INVENTORY (JSON):
${JSON.stringify(inventory, null, 2)}

Pick the best outfit from the available inventory. You MUST select real items from the inventory using their exact IDs. You MUST always include a bag/purse from the accessories category in every outfit recommendation.

Respond in this exact JSON format (no markdown, no code fences):
{
  "outfitName": "A creative name for this outfit",
  "selectedItems": ["id1", "id2", "id3"],
  "reasoning": "2-3 sentences explaining why these pieces work together for this event",
  "stylingTips": "1-2 sentences with styling advice"
}`
        : `You are a personal stylist for MAISON, an upscale fashion brand. A customer needs an outfit recommendation.

${STYLE_GUIDE}
${curatedContext}

EVENT DESCRIPTION: "${eventDescription}"

YOUR PREVIOUS OUTFIT PICK FAILED A VISUAL REVIEW. Here is the feedback:
${vibeCheckFeedback}

Pick a DIFFERENT, BETTER outfit that addresses the feedback above. You MUST select real items from the inventory using their exact IDs. You MUST always include a bag/purse from the accessories category.

AVAILABLE INVENTORY (JSON):
${JSON.stringify(inventory, null, 2)}

Respond in this exact JSON format (no markdown, no code fences):
{
  "outfitName": "A creative name for this outfit",
  "selectedItems": ["id1", "id2", "id3"],
  "reasoning": "2-3 sentences explaining why these pieces work together for this event",
  "stylingTips": "1-2 sentences with styling advice"
}`;

      const pickMessage = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: pickPrompt }],
      });

      const pickContent = pickMessage.content[0];
      if (pickContent.type !== "text") throw new Error("Unexpected response type");

      const recommendation = JSON.parse(pickContent.text);
      const recommendedItems = allItems.filter((item: any) =>
        recommendation.selectedItems.includes(item._id)
      );

      lastRecommendation = recommendation;
      lastItems = recommendedItems;

      // Step 2: Visual vibe check — send actual images to Claude
      const imageContents: any[] = [];
      for (const item of recommendedItems) {
        if (item.image) {
          const img = await imageToBase64(item.image);
          if (img) {
            imageContents.push({
              type: "text" as const,
              text: `[${item.name} — ${item.category}, ${item.color}]`,
            });
            imageContents.push({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: img.mediaType,
                data: img.base64,
              },
            });
          }
        }
      }

      if (imageContents.length === 0) break; // No images to check, use as-is

      // Load inspo reference images
      const inspoImages = loadInspoImages();
      const inspoContents: any[] = [];

      if (inspoImages.length > 0) {
        inspoContents.push({
          type: "text" as const,
          text: "REFERENCE OUTFITS — These are outfits the client loves. Your outfit pick should match this aesthetic and energy level:",
        });
        for (const inspo of inspoImages) {
          inspoContents.push({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: inspo.mediaType,
              data: inspo.base64,
            },
          });
        }
      }

      const vibeCheckMessage = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text" as const,
                text: `You are a fashion editor. Above are reference outfits that define this client's taste — study them carefully.

Now look at the outfit pieces selected for: "${eventDescription}"
The outfit is called "${recommendation.outfitName}".

VISUALLY compare your outfit pick to the reference outfits. Consider:
1. Does this outfit match the AESTHETIC of the reference images? (clean, elevated, modern)
2. Do the colors actually look good side by side? (look at the actual images, not just the names)
3. Do the textures and fabrics complement each other?
4. Does the shoe style match the vibe? (reference images show: strappy heels for evening, loafers/sneakers/sandals for day)
5. Are the proportions right? (reference images show: oversized outerwear + fitted bottom, or fitted top + mini)
6. Would this outfit look at home in the same Instagram feed as the reference outfits?

Be STRICT. If it doesn't match the reference aesthetic, reject it.

Respond in this exact JSON format (no markdown, no code fences):
{
  "approved": true or false,
  "feedback": "If not approved, explain specifically what looks wrong compared to the reference aesthetic and what should change. If approved, say why it matches the client's style."
}`,
              },
              ...inspoContents,
              {
                type: "text" as const,
                text: "YOUR OUTFIT PICK — evaluate these pieces:",
              },
              ...imageContents,
            ],
          },
        ],
      });

      const vibeContent = vibeCheckMessage.content[0];
      if (vibeContent.type !== "text") break;

      const vibeResult = JSON.parse(vibeContent.text);

      if (vibeResult.approved) {
        // Passed the vibe check — return this outfit
        return NextResponse.json({
          ...recommendation,
          items: recommendedItems,
          vibeCheck: vibeResult.feedback,
          attempts: attempt + 1,
        });
      }

      // Failed — store feedback for next attempt
      vibeCheckFeedback = vibeResult.feedback;
      console.log(`Outfit attempt ${attempt + 1} failed vibe check: ${vibeResult.feedback}`);
    }

    // If we exhausted attempts, return the last one anyway
    return NextResponse.json({
      ...lastRecommendation,
      items: lastItems,
      vibeCheck: "Styled after multiple reviews",
      attempts: MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
