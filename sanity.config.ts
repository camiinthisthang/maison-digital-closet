"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { assist } from "@sanity/assist";
import { schemaTypes } from "@/sanity/schemas";
import { AutoTagAction } from "@/sanity/actions/autoTagAction";

export default defineConfig({
  name: "digital-closet",
  title: "MAISON Digital Closet",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",

  basePath: "/studio",

  plugins: [structureTool(), visionTool(), assist()],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      if (context.schemaType === "clothingItem") {
        return [AutoTagAction, ...prev];
      }
      return prev;
    },
  },
});
