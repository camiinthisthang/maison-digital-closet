import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { client } from "./client";

// Image URL builder — converts Sanity image references into CDN URLs.
// Sanity stores images as references (like "image-abc123-800x600-jpg"),
// not as URLs. This builder turns those refs into optimized image URLs.
//
// Usage: urlFor(item.image).width(400).height(400).url()
// This gives you a URL like: https://cdn.sanity.io/images/projectId/dataset/abc123-800x600.jpg?w=400&h=400
// Sanity's CDN automatically resizes and optimizes the image on the fly.
const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
