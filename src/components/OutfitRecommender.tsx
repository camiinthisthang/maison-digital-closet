"use client";

import { useState } from "react";
import OutfitResult from "./OutfitResult";
import PackingResult from "./PackingResult";

type Mode = "style" | "pack";

export default function OutfitRecommender() {
  const [mode, setMode] = useState<Mode>("style");

  // Style Me state
  const [eventDescription, setEventDescription] = useState("");
  const [styleResult, setStyleResult] = useState<any>(null);
  const [styleLoading, setStyleLoading] = useState(false);
  const [styleError, setStyleError] = useState("");

  // Pack for Me state
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [month, setMonth] = useState("");
  const [vibe, setVibe] = useState("");
  const [packResult, setPackResult] = useState<any>(null);
  const [packLoading, setPackLoading] = useState(false);
  const [packError, setPackError] = useState("");

  async function handleStyleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDescription.trim()) return;

    setStyleLoading(true);
    setStyleError("");
    setStyleResult(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      setStyleResult(data);
    } catch (err: any) {
      setStyleError(err.message);
    } finally {
      setStyleLoading(false);
    }
  }

  async function handlePackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim()) return;

    setPackLoading(true);
    setPackError("");
    setPackResult(null);

    try {
      const res = await fetch("/api/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days: parseInt(days),
          month: month || undefined,
          vibe: vibe || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      setPackResult(data);
    } catch (err: any) {
      setPackError(err.message);
    } finally {
      setPackLoading(false);
    }
  }

  return (
    <section
      id="style-me"
      className="py-16 px-4 sm:px-6 lg:px-8 bg-brand-50/50"
    >
      <div className="max-w-3xl mx-auto">
        {/* Mode switcher */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setMode("style")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                mode === "style"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Style Me
            </button>
            <button
              onClick={() => setMode("pack")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                mode === "pack"
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pack for Me
            </button>
          </div>
        </div>

        {mode === "style" ? (
          <>
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl sm:text-4xl text-gray-900">
                Style Me
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Describe your event and our AI stylist will curate the perfect
                outfit from the collection.
              </p>
            </div>

            <form onSubmit={handleStyleSubmit} className="space-y-4">
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="e.g. Rooftop cocktail party in Manhattan on a cool autumn evening. I want to look chic but not overdressed..."
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-5 py-4 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none resize-none transition-colors"
              />
              <button
                type="submit"
                disabled={styleLoading || !eventDescription.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {styleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Styling your look...
                  </span>
                ) : (
                  "Get Outfit Recommendation"
                )}
              </button>
            </form>

            {styleError && <ErrorBox message={styleError} />}

            {styleResult && (
              <div className="mt-8">
                <OutfitResult
                  outfitName={styleResult.outfitName}
                  items={styleResult.items}
                  reasoning={styleResult.reasoning}
                  stylingTips={styleResult.stylingTips}
                  eventDescription={eventDescription}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl sm:text-4xl text-gray-900">
                Pack for Me
              </h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Tell us about your trip and we&apos;ll put together outfits for
                every day — daytime and evening.
              </p>
            </div>

            <form onSubmit={handlePackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Where are you going?
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Paris, Tulum, Tokyo..."
                  className="w-full rounded-xl border border-gray-200 px-5 py-3 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    How many days?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-5 py-3 text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    What month?
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-5 py-3 text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Select month</option>
                    {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Trip vibe{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="e.g. romantic getaway, girls trip, business + leisure..."
                  className="w-full rounded-xl border border-gray-200 px-5 py-3 text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={packLoading || !destination.trim()}
                className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {packLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Packing your suitcase...
                  </span>
                ) : (
                  "Pack My Trip"
                )}
              </button>
            </form>

            {packError && <ErrorBox message={packError} />}

            {packResult && (
              <div className="mt-8">
                <PackingResult
                  tripName={packResult.tripName}
                  packingTips={packResult.packingTips}
                  days={packResult.days}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm">
      {message}
    </div>
  );
}
