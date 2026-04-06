import { createClient } from "next-sanity";

// This is the Sanity client — it's how the app reads data from the Content Lake.
// The client only needs the project ID and dataset to make PUBLIC reads.
// No API token is needed for reading published content (Sanity allows it by default).
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!, // From sanity.io/manage
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01", // Locks the API behavior to this date (prevents breaking changes)
  useCdn: false, // false = always fresh data. true = faster but cached (can be stale for ~60s)
});
