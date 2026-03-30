#!/usr/bin/env node

/**
 * MAISON Digital Closet — Bulk Upload Script
 *
 * Scans a folder of clothing images, converts HEIC → JPEG,
 * uploads to Sanity, auto-tags with Claude Vision, and publishes.
 *
 * Usage:
 *   node scripts/bulk-upload.mjs ./path/to/images
 *
 * Requires SANITY_API_WRITE_TOKEN in .env.local (Editor or Admin permissions)
 */

import { createClient } from "@sanity/client";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import dotenv from "dotenv";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const SANITY_TOKEN = process.env.SANITY_API_WRITE_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SANITY_PROJECT_ID || !SANITY_TOKEN || !ANTHROPIC_KEY) {
  console.error("\n❌ Missing required environment variables in .env.local:");
  if (!SANITY_PROJECT_ID) console.error("   - NEXT_PUBLIC_SANITY_PROJECT_ID");
  if (!SANITY_TOKEN)
    console.error(
      "   - SANITY_API_WRITE_TOKEN (create one in sanity.io/manage > API > Tokens with Editor permissions)"
    );
  if (!ANTHROPIC_KEY) console.error("   - ANTHROPIC_API_KEY");
  process.exit(1);
}

const sanity = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const SUPPORTED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
]);
const TEMP_DIR = path.resolve(process.cwd(), ".tmp-conversions");

// ── Helpers ──────────────────────────────────────────────

function convertHeicToJpeg(inputPath) {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(TEMP_DIR, `${baseName}.jpg`);

  execSync(`sips -s format jpeg "${inputPath}" --out "${outputPath}"`, {
    stdio: "pipe",
  });

  return outputPath;
}

async function uploadImageToSanity(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const contentType =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;

  const asset = await sanity.assets.upload("image", buffer, {
    filename: path.basename(filePath),
    contentType,
  });

  return asset;
}

async function autoTagWithClaude(imageUrl) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
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
    throw new Error("No response from Claude");
  }

  let jsonStr = textContent.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(jsonStr);
}

async function createAndPublishItem(asset, tags) {
  const docId = `clothingItem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Create the document (published, no draft prefix)
  const doc = await sanity.create({
    _id: docId,
    _type: "clothingItem",
    name: tags.name,
    category: tags.category,
    color: tags.color,
    season: tags.season,
    occasions: tags.occasions,
    description: tags.description,
    image: {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: asset._id,
      },
    },
  });

  return doc;
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const inputDir = process.argv[2];

  if (!inputDir) {
    console.error("\nUsage: node scripts/bulk-upload.mjs ./path/to/images\n");
    process.exit(1);
  }

  const resolvedDir = path.resolve(inputDir);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`\n❌ Directory not found: ${resolvedDir}\n`);
    process.exit(1);
  }

  // Gather all image files
  const allFiles = fs.readdirSync(resolvedDir);
  const imageFiles = allFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext) && !f.startsWith(".");
  });

  console.log(`\n🗂  Found ${imageFiles.length} images in ${resolvedDir}\n`);

  if (imageFiles.length === 0) {
    console.error("No supported images found (.jpg, .jpeg, .png, .webp, .heic, .heif)");
    process.exit(1);
  }

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const filename = imageFiles[i];
    const filePath = path.join(resolvedDir, filename);
    const ext = path.extname(filename).toLowerCase();
    const isHeic = ext === ".heic" || ext === ".heif";

    console.log(
      `[${i + 1}/${imageFiles.length}] ${filename}${isHeic ? " (converting HEIC → JPEG)" : ""}`
    );

    try {
      // Step 1: Convert HEIC if needed
      let uploadPath = filePath;
      if (isHeic) {
        uploadPath = convertHeicToJpeg(filePath);
        console.log("   ✓ Converted to JPEG");
      }

      // Step 2: Upload to Sanity
      const asset = await uploadImageToSanity(uploadPath);
      const imageUrl = `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${asset._id.replace("image-", "").replace(/-([a-z]+)$/, ".$1")}?w=1024`;
      console.log("   ✓ Uploaded to Sanity");

      // Step 3: Auto-tag with Claude
      const tags = await autoTagWithClaude(imageUrl);
      console.log(`   ✓ Tagged: ${tags.name} (${tags.category}, ${tags.color})`);

      // Step 4: Create and publish document
      const doc = await createAndPublishItem(asset, tags);
      console.log(`   ✓ Published: ${doc._id}`);

      // Clean up temp file
      if (isHeic && uploadPath !== filePath) {
        fs.unlinkSync(uploadPath);
      }

      success++;

      // Rate limiting — pause between items to avoid API throttling
      if (i < imageFiles.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (error) {
      failed++;
      errors.push({ filename, error: error.message });
      console.error(`   ✗ Failed: ${error.message}`);
    }
  }

  // Clean up temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log(`✅ Success: ${success}/${imageFiles.length}`);
  if (failed > 0) {
    console.log(`❌ Failed:  ${failed}/${imageFiles.length}`);
    errors.forEach((e) => console.log(`   - ${e.filename}: ${e.error}`));
  }
  console.log("═".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});
