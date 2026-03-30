"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import type { ClothingItemType } from "./ClothingCard";

interface OutfitResultProps {
  outfitName: string;
  items: ClothingItemType[];
  reasoning: string;
  stylingTips: string;
  eventDescription?: string;
}

export default function OutfitResult({
  outfitName,
  items,
  reasoning,
  stylingTips,
  eventDescription,
}: OutfitResultProps) {
  const [illustrationUrl, setIllustrationUrl] = useState<string | null>(null);
  const [illustrationLoading, setIllustrationLoading] = useState(false);
  const [illustrationError, setIllustrationError] = useState("");
  const [lightboxItem, setLightboxItem] = useState<ClothingItemType | null>(
    null
  );

  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!hasTriggered.current && items.length > 0) {
      hasTriggered.current = true;
      generateIllustration();
    }
  }, []);

  async function generateIllustration() {
    setIllustrationLoading(true);
    setIllustrationError("");

    try {
      const res = await fetch("/api/illustrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfitName,
          items: items.map((item) => ({
            name: item.name,
            category: item.category,
            color: item.color,
            description: item.description,
          })),
          reasoning,
          eventDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate illustration");
      }

      const data = await res.json();
      setIllustrationUrl(data.imageUrl);
    } catch (err: any) {
      setIllustrationError(err.message);
    } finally {
      setIllustrationLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 px-6 py-5">
        <p className="text-brand-200 text-xs uppercase tracking-widest">
          Your Styled Look
        </p>
        <h3 className="text-white font-display text-2xl mt-1">{outfitName}</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Fashion Illustration — hero position */}
        <div className="flex justify-center">
          {illustrationUrl ? (
            <div className="rounded-2xl overflow-hidden shadow-lg max-w-sm w-full">
              <img
                src={illustrationUrl}
                alt={`Fashion illustration: ${outfitName}`}
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="w-full max-w-sm rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/30 flex flex-col items-center justify-center p-8 min-h-[320px]">
              {illustrationError ? (
                <>
                  <p className="text-sm text-red-500 text-center mb-3">
                    {illustrationError}
                  </p>
                  <button
                    onClick={generateIllustration}
                    className="px-5 py-2 bg-brand-700 text-white text-sm font-medium rounded-full hover:bg-brand-800 transition-colors"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <div className="relative w-12 h-12 mb-4">
                    <svg
                      className="animate-spin w-12 h-12 text-brand-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-brand-600 text-center font-medium">
                    Creating your look...
                  </p>
                  <p className="text-xs text-brand-400 text-center mt-1">
                    This takes about 15-20 seconds
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* The Pieces — horizontal strip */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 text-center">
            The Pieces
          </p>
          <div className="flex justify-center gap-5 flex-wrap">
            {items.map((item) => (
              <button
                key={item._id}
                onClick={() => setLightboxItem(item)}
                className="group cursor-pointer w-36 flex-shrink-0"
              >
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-brand-50 mb-2 ring-0 group-hover:ring-2 ring-brand-500 transition-all shadow-sm group-hover:shadow-md">
                  {item.image && (
                    <Image
                      src={urlFor(item.image).width(300).height(400).url()}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="144px"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 text-center leading-tight">
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 capitalize text-center mt-0.5">
                  {item.category}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Why This Works + Styling Tips — two column on desktop */}
        <div className="border-t border-gray-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-2">
              Why This Works
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {reasoning}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-2">
              Styling Tips
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {stylingTips}
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative bg-white rounded-2xl overflow-hidden max-w-lg w-full max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-md transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="relative aspect-[3/4] w-full">
              {lightboxItem.image && (
                <Image
                  src={urlFor(lightboxItem.image).width(800).height(1067).url()}
                  alt={lightboxItem.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
              )}
            </div>
            <div className="p-5">
              <h4 className="font-display text-xl text-gray-900">
                {lightboxItem.name}
              </h4>
              <p className="text-sm text-gray-500 capitalize mt-1">
                {lightboxItem.category} · {lightboxItem.color}
              </p>
              {lightboxItem.description && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  {lightboxItem.description}
                </p>
              )}
              {lightboxItem.occasions && lightboxItem.occasions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {lightboxItem.occasions.map((occ: string) => (
                    <span
                      key={occ}
                      className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs rounded-full capitalize"
                    >
                      {occ}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
