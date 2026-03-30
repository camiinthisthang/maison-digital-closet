import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";

function getWriteClient() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { password, outfit } = await request.json();

    if (password !== process.env.CURATE_PASSWORD || "maison2026") {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (!outfit?.name || !outfit?.items?.length || !outfit?.occasion) {
      return NextResponse.json(
        { error: "Outfit name, occasion, and at least 2 items are required" },
        { status: 400 }
      );
    }

    const doc = {
      _type: "curatedOutfit",
      name: outfit.name,
      occasion: outfit.occasion,
      curatorName: outfit.curatorName || "Anonymous",
      notes: outfit.notes || "",
      items: outfit.items.map((id: string) => ({
        _type: "reference",
        _ref: id,
        _key: id,
      })),
    };

    const result = await getWriteClient().create(doc);

    return NextResponse.json({ success: true, id: result._id });
  } catch (error) {
    console.error("Curate error:", error);
    return NextResponse.json(
      { error: "Failed to save outfit" },
      { status: 500 }
    );
  }
}

// GET: fetch existing curated outfits (for display on the curate page)
export async function GET(request: NextRequest) {
  const pw = request.nextUrl.searchParams.get("password");
  if (pw !== process.env.CURATE_PASSWORD || "maison2026") {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  try {
    const outfits = await getWriteClient().fetch(`*[_type == "curatedOutfit"] | order(_createdAt desc) {
      _id,
      name,
      occasion,
      curatorName,
      notes,
      "items": items[]-> {
        _id, name, category, color, image
      }
    }`);
    return NextResponse.json(outfits);
  } catch (error) {
    console.error("Fetch curated error:", error);
    return NextResponse.json({ error: "Failed to fetch outfits" }, { status: 500 });
  }
}
