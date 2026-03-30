"use client";

import { useState } from "react";
import ClothingCard, { type ClothingItemType } from "./ClothingCard";

const CATEGORIES = [
  "all",
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
];

export default function ClosetGrid({ items }: { items: ClothingItemType[] }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <section id="closet" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-gray-900">
            The Collection
          </h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Every piece in our curated inventory, managed through Sanity&apos;s
            structured content platform.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                activeCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <ClothingCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No items yet.</p>
            <p className="mt-2">
              Head to{" "}
              <a href="/studio" className="text-brand-600 underline">
                /studio
              </a>{" "}
              to add clothing items.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
