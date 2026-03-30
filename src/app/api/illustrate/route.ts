import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { outfitName, items, reasoning, eventDescription } =
      await request.json();

    if (!items?.length) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Build a detailed fashion illustration prompt from the outfit
    const itemDescriptions = items
      .map(
        (item: any) =>
          `${item.name}: ${item.color} ${item.category} — ${item.description}`
      )
      .join("\n");

    const prompt = `High-end fashion editorial illustration, watercolor and ink style. A stylish model wearing this complete outfit:

${itemDescriptions}

The look is called "${outfitName}". Setting: ${eventDescription || "urban lifestyle"}.

Style: Modern fashion illustration with clean lines, elegant watercolor washes, subtle ink outlines. Full body view showing the complete outfit coordination. Soft neutral background with minimal abstract brushstrokes. Professional fashion editorial quality, similar to Garance Doré or Inslee Haynes illustration style. The model should look confident and natural.`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1536",
      quality: "high",
    });

    const imageData = response.data?.[0];

    if (!imageData) {
      throw new Error("No image generated");
    }

    // gpt-image-1 returns base64 by default
    const base64 = imageData.b64_json;
    const url = imageData.url;

    return NextResponse.json({
      imageUrl: url || `data:image/png;base64,${base64}`,
    });
  } catch (error: any) {
    console.error("Illustration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate illustration" },
      { status: 500 }
    );
  }
}
