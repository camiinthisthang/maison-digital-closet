import { useDocumentOperation, useClient } from "sanity";
import { useState, useCallback } from "react";
import imageUrlBuilder from "@sanity/image-url";

// Custom Document Action — this adds the "Auto-Tag with AI" button to Clothing Items in Studio.
// Document Actions are React hooks that return a button config (label, handler, disabled state).
// This is registered in sanity.config.ts under document.actions.
//
// WHY THIS ONLY WORKS IN EMBEDDED STUDIO:
// The hosted studio (your-project.sanity.studio) uses Sanity's default config.
// Our embedded studio (/studio) uses our custom sanity.config.ts which includes this action.
// This is the key advantage of embedding — you can add custom workflows.
export function AutoTagAction(props: any) {
  const { draft, published, id, type, onComplete } = props;
  const doc = draft || published; // Use the draft if it exists, otherwise the published version

  // useDocumentOperation gives us "patch" — the ability to write to this document's fields.
  // This is the Sanity v3 way to modify documents from within Studio.
  const { patch } = useDocumentOperation(id, type);

  // useClient gives us a Sanity client to build image URLs from asset references.
  const client = useClient({ apiVersion: "2024-01-01" });
  const [isRunning, setIsRunning] = useState(false);

  const onAutoTag = useCallback(async () => {
    // Guard: make sure an image has been uploaded before trying to analyze it
    if (!doc?.image?.asset?._ref) {
      alert("Please upload an image first.");
      if (onComplete) onComplete();
      return;
    }

    setIsRunning(true);

    try {
      // Step 1: Convert the Sanity image reference to a CDN URL that Claude can access.
      // Sanity stores images as refs like "image-abc123-800x600-jpg",
      // but Claude needs an actual URL to look at the image.
      const builder = imageUrlBuilder(client);
      const imageUrl = builder.image(doc.image).width(1024).url();

      // Step 2: Send the image URL to our /api/auto-tag endpoint.
      // That endpoint forwards it to Claude's Vision API with a prompt
      // asking it to analyze the clothing and return structured data.
      const response = await fetch("/api/auto-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Auto-tag failed");
      }

      // Step 3: Claude returns JSON like { name, category, color, season, occasions, description }
      const tags = await response.json();

      // Step 4: Write all the AI-generated values into the document fields.
      // patch.execute takes an array of operations — here we "set" multiple fields at once.
      // After this, all the form fields in Studio are populated automatically.
      patch.execute([
        {
          set: {
            name: tags.name,
            category: tags.category,
            color: tags.color,
            season: tags.season,
            occasions: tags.occasions,
            description: tags.description,
          },
        },
      ]);
    } catch (error: any) {
      console.error("Auto-tag error:", error);
      alert(`Auto-tag failed: ${error.message}`);
    } finally {
      setIsRunning(false);
      if (onComplete) onComplete();
    }
  }, [doc, client, patch, onComplete]);

  // Return the button configuration that Sanity renders in the document actions bar.
  return {
    label: isRunning ? "Analyzing..." : "Auto-Tag with AI",
    disabled: isRunning || !doc?.image?.asset?._ref, // Disabled until an image is uploaded
    onHandle: onAutoTag,
    tone: "primary" as const, // Makes the button stand out visually
  };
}
