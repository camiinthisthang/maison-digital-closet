"use client";

// This is the embedded Sanity Studio route.
// The [[...tool]] folder name is a Next.js "catch-all" route — it matches
// /studio, /studio/structure, /studio/vision, and any other Studio sub-paths.
//
// NextStudio renders the full Sanity Studio UI inside your Next.js app.
// It uses the config from sanity.config.ts, which includes our custom schemas,
// plugins, and the AutoTagAction document action.
//
// Without this file, you'd only have the hosted studio at your-project.sanity.studio.
// With this file, Studio lives at /studio in your app — same URL, same deploy.

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
