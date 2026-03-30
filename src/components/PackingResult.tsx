"use client";

import { useState } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";
import type { ClothingItemType } from "./ClothingCard";

interface OutfitSlot {
  outfitName: string;
  items: ClothingItemType[];
  description: string;
}

interface DayPlan {
  dayNumber: number;
  dayTitle: string;
  daytime: OutfitSlot;
  evening: OutfitSlot;
}

interface PackingResultProps {
  tripName: string;
  packingTips: string;
  days: DayPlan[];
}

export default function PackingResult({
  tripName,
  packingTips,
  days,
}: PackingResultProps) {
  const [activeDay, setActiveDay] = useState(0);
  const [lightboxItem, setLightboxItem] = useState<ClothingItemType | null>(
    null
  );

  const currentDay = days[activeDay];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 px-6 py-5">
        <p className="text-brand-200 text-xs uppercase tracking-widest">
          Your Packing Plan
        </p>
        <h3 className="text-white font-display text-2xl mt-1">{tripName}</h3>
        <p className="text-brand-200 text-sm mt-2">{packingTips}</p>
      </div>

      {/* Day tabs */}
      <div className="border-b border-gray-100 px-6 pt-4">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {days.map((day, index) => (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(index)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeDay === index
                  ? "bg-brand-50 text-brand-800 border-b-2 border-brand-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Active day content */}
      {currentDay && (
        <div className="p-6 space-y-8">
          <h4 className="font-display text-xl text-gray-900 text-center">
            {currentDay.dayTitle}
          </h4>

          {/* Daytime outfit */}
          <OutfitSection
            label="Daytime"
            icon="☀️"
            outfit={currentDay.daytime}
            onItemClick={setLightboxItem}
          />

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-widest">
              transition to evening
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Evening outfit */}
          <OutfitSection
            label="Evening"
            icon="🌙"
            outfit={currentDay.evening}
            onItemClick={setLightboxItem}
          />
        </div>
      )}

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OutfitSection({
  label,
  icon,
  outfit,
  onItemClick,
}: {
  label: string;
  icon: string;
  outfit: OutfitSlot;
  onItemClick: (item: ClothingItemType) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h5 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
          {label}
        </h5>
        <span className="text-sm text-gray-500 ml-1">— {outfit.outfitName}</span>
      </div>
      <p className="text-sm text-gray-600 mb-4">{outfit.description}</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {outfit.items.map((item) => (
          <button
            key={item._id}
            onClick={() => onItemClick(item)}
            className="group cursor-pointer w-28 flex-shrink-0"
          >
            <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-brand-50 mb-1.5 ring-0 group-hover:ring-2 ring-brand-500 transition-all shadow-sm group-hover:shadow-md">
              {item.image && (
                <Image
                  src={urlFor(item.image).width(240).height(320).url()}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  sizes="112px"
                />
              )}
            </div>
            <p className="text-xs font-medium text-gray-900 text-center leading-tight">
              {item.name}
            </p>
            <p className="text-[10px] text-gray-400 capitalize text-center">
              {item.category}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
