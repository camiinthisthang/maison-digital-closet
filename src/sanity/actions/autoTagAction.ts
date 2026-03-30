import { useDocumentOperation, useClient } from "sanity";
import { useState, useCallback } from "react";
import imageUrlBuilder from "@sanity/image-url";

export function AutoTagAction(props: any) {
  const { draft, published, id, type, onComplete } = props;
  const doc = draft || published;
  const { patch } = useDocumentOperation(id, type);
  const client = useClient({ apiVersion: "2024-01-01" });
  const [isRunning, setIsRunning] = useState(false);

  const onAutoTag = useCallback(async () => {
    if (!doc?.image?.asset?._ref) {
      alert("Please upload an image first.");
      if (onComplete) onComplete();
      return;
    }

    setIsRunning(true);

    try {
      const builder = imageUrlBuilder(client);
      const imageUrl = builder.image(doc.image).width(1024).url();

      const response = await fetch("/api/auto-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Auto-tag failed");
      }

      const tags = await response.json();

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

  return {
    label: isRunning ? "Analyzing..." : "Auto-Tag with AI",
    disabled: isRunning || !doc?.image?.asset?._ref,
    onHandle: onAutoTag,
    tone: "primary" as const,
  };
}
