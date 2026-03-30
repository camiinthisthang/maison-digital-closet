"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { urlFor } from "@/sanity/image";

interface ClothingItem {
  _id: string;
  name: string;
  category: string;
  color: string;
  image: any;
}

interface CuratedOutfit {
  _id: string;
  name: string;
  occasion: string;
  curatorName: string;
  notes: string;
  items: ClothingItem[];
}

const OCCASIONS = [
  { title: "Casual Day", value: "casual" },
  { title: "Date Night", value: "date-night" },
  { title: "Night Out / Party", value: "party" },
  { title: "Brunch", value: "brunch" },
  { title: "Business / Work", value: "business" },
  { title: "Vacation", value: "vacation" },
  { title: "Formal / Event", value: "formal" },
];

const CATEGORIES = [
  "all",
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
];

export default function CuratePage() {
  // Auth state
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // Inventory state
  const [inventory, setInventory] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Outfit builder state
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [outfitName, setOutfitName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [curatorName, setCuratorName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Existing curated outfits
  const [curatedOutfits, setCuratedOutfits] = useState<CuratedOutfit[]>([]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setInventory(data);
    } catch {
      console.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCuratedOutfits = useCallback(async () => {
    try {
      const res = await fetch(`/api/curate?password=${encodeURIComponent(password)}`);
      if (res.ok) {
        const data = await res.json();
        setCuratedOutfits(data);
      }
    } catch {
      console.error("Failed to fetch curated outfits");
    }
  }, [password]);

  async function handleLogin() {
    setAuthError("");
    try {
      const res = await fetch(`/api/curate?password=${encodeURIComponent(password)}`);
      if (res.ok) {
        setAuthenticated(true);
        fetchInventory();
        const data = await res.json();
        setCuratedOutfits(data);
      } else {
        setAuthError("Wrong password. Try again.");
      }
    } catch {
      setAuthError("Something went wrong.");
    }
  }

  function toggleItem(item: ClothingItem) {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      if (exists) return prev.filter((i) => i._id !== item._id);
      if (prev.length >= 6) return prev; // Max 6 items
      return [...prev, item];
    });
  }

  function isSelected(id: string) {
    return selectedItems.some((i) => i._id === id);
  }

  async function saveOutfit() {
    if (!outfitName || !occasion || selectedItems.length < 2) return;

    setSaving(true);
    setSaveMessage("");

    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          outfit: {
            name: outfitName,
            occasion,
            curatorName: curatorName || "Anonymous",
            notes,
            items: selectedItems.map((i) => i._id),
          },
        }),
      });

      if (res.ok) {
        setSaveMessage("Outfit saved!");
        setSelectedItems([]);
        setOutfitName("");
        setOccasion("");
        setNotes("");
        fetchCuratedOutfits();
      } else {
        const data = await res.json();
        setSaveMessage(data.error || "Failed to save");
      }
    } catch {
      setSaveMessage("Failed to save outfit");
    } finally {
      setSaving(false);
    }
  }

  const filteredInventory =
    categoryFilter === "all"
      ? inventory
      : inventory.filter((i) => i.category === categoryFilter);

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <h1 className="font-display text-3xl mb-2">MAISON</h1>
          <p className="text-sm text-gray-500 mb-6">
            Style Curator Access
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Enter password"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {authError && (
            <p className="text-red-500 text-sm mt-2">{authError}</p>
          )}
          <button
            onClick={handleLogin}
            className="mt-4 w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div>
            <span className="font-display text-xl">MAISON</span>
            <span className="text-sm text-gray-400 ml-3">Style Curator</span>
          </div>
          <div className="text-sm text-gray-500">
            {curatorName && <span>Curating as {curatorName}</span>}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Curator name input */}
        {!curatorName && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 max-w-md mx-auto text-center">
            <p className="text-sm text-gray-500 mb-3">
              First, tell us your name so we know who curated what
            </p>
            <input
              type="text"
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value) {
                  setCuratorName(e.currentTarget.value);
                }
              }}
            />
            <p className="text-xs text-gray-400 mt-2">Press Enter to continue</p>
          </div>
        )}

        {curatorName && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Outfit Builder */}
            <div className="lg:col-span-1 space-y-6">
              {/* Current selection */}
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h2 className="font-display text-lg mb-4">Your Outfit</h2>

                {selectedItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Click items from the closet to build an outfit</p>
                    <p className="text-xs mt-1">Select 2-6 pieces</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {selectedItems.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => toggleItem(item)}
                        className="relative group"
                      >
                        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-100">
                          {item.image && (
                            <Image
                              src={urlFor(item.image).width(200).height(267).url()}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          )}
                          <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/30 transition-colors flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 truncate">{item.name}</p>
                      </button>
                    ))}
                  </div>
                )}

                {selectedItems.length >= 2 && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={outfitName}
                      onChange={(e) => setOutfitName(e.target.value)}
                      placeholder="Name this outfit..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="">Select occasion...</option>
                      {OCCASIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.title}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Why do these pieces work together? (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                    <button
                      onClick={saveOutfit}
                      disabled={saving || !outfitName || !occasion}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? "Saving..." : "Save Outfit"}
                    </button>
                    {saveMessage && (
                      <p className={`text-sm text-center ${saveMessage.includes("saved") ? "text-green-600" : "text-red-500"}`}>
                        {saveMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Previously curated outfits */}
              {curatedOutfits.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="font-display text-lg mb-4">
                    Curated Outfits ({curatedOutfits.length})
                  </h3>
                  <div className="space-y-4">
                    {curatedOutfits.map((outfit) => (
                      <div key={outfit._id} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{outfit.name}</p>
                            <p className="text-xs text-gray-400">
                              by {outfit.curatorName} · {outfit.occasion}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {outfit.items?.map((item) => (
                            <div key={item._id} className="w-12 h-16 relative rounded overflow-hidden bg-gray-100">
                              {item.image && (
                                <Image
                                  src={urlFor(item.image).width(96).height(128).url()}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        {outfit.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">{outfit.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Inventory Browser */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg">The Closet</h2>
                  <p className="text-sm text-gray-400">{filteredInventory.length} items</p>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors ${
                        categoryFilter === cat
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-400">Loading closet...</div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {filteredInventory.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => toggleItem(item)}
                        className={`group text-left transition-all ${
                          isSelected(item._id) ? "ring-2 ring-brand-600 rounded-xl" : ""
                        }`}
                      >
                        <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-gray-100 mb-1.5">
                          {item.image && (
                            <Image
                              src={urlFor(item.image).width(200).height(267).url()}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="(max-width: 640px) 33vw, 20vw"
                            />
                          )}
                          {isSelected(item._id) && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{item.category} · {item.color}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
