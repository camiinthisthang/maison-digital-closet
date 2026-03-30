import { NextResponse } from "next/server";
import { client } from "@/sanity/client";

export async function GET() {
  try {
    const items = await client.fetch(`*[_type == "clothingItem"] | order(category asc, name asc) {
      _id,
      name,
      category,
      color,
      image
    }`);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
