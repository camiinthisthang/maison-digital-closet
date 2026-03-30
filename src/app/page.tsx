import { client } from "@/sanity/client";
import { ALL_CLOTHING_QUERY } from "@/sanity/lib/queries";
import ClosetGrid from "@/components/ClosetGrid";
import OutfitRecommender from "@/components/OutfitRecommender";

export const revalidate = 0;

export default async function Home() {
  let items = [];
  try {
    items = await client.fetch(ALL_CLOTHING_QUERY);
  } catch {
    // Sanity not configured yet — show empty state
  }

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="font-display text-2xl tracking-wide">
            MAISON
          </a>
          <div className="flex items-center gap-6">
            <a
              href="#closet"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Collection
            </a>
            <a
              href="#style-me"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Style Me
            </a>
            <a
              href="/studio"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              Studio
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-600 text-sm uppercase tracking-[0.2em] font-medium">
            Powered by Sanity + Claude AI
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-gray-900 mt-4 leading-tight">
            The Digital Closet
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            A curated fashion inventory managed through Sanity&apos;s structured
            content platform. Describe any event and let AI style the perfect
            outfit from our collection.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#style-me"
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Style Me
            </a>
            <a
              href="#closet"
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium border border-gray-200 hover:border-gray-300 transition-colors"
            >
              Browse Collection
            </a>
          </div>
        </div>
      </section>

      {/* Closet Grid */}
      <ClosetGrid items={items} />

      {/* AI Recommender */}
      <OutfitRecommender />

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p className="font-display text-lg text-gray-900">MAISON</p>
          <p>
            Built with{" "}
            <span className="text-gray-600">Next.js</span> +{" "}
            <span className="text-gray-600">Sanity</span> +{" "}
            <span className="text-gray-600">Claude AI</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
