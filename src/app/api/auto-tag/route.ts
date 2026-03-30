import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: `You are a fashion product cataloger. Analyze this clothing item image and return ONLY valid JSON with these fields:

{
  "name": "A concise product name (e.g. 'Ivory Silk Blouse', 'Dark Wash Slim Jeans')",
  "category": "MUST be exactly one of: tops, bottoms, dresses, outerwear, shoes, accessories",
  "color": "The primary color (e.g. 'navy', 'ivory', 'black', 'olive')",
  "season": ["Array of applicable seasons from: spring, summer, fall, winter"],
  "occasions": ["Array of applicable occasions from: casual, formal, business, party, outdoor, date-night, wedding, brunch"],
  "description": "A 2-3 sentence product description suitable for a fashion brand"
}

Return ONLY the JSON object, no markdown formatting or extra text.`,
            },
          ],
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response, stripping any markdown code fences if present
    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const tags = JSON.parse(jsonStr);

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error("Auto-tag error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-tag image" },
      { status: 500 }
    );
  }
}
