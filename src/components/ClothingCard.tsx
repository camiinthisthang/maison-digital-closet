import Image from "next/image";
import { urlFor } from "@/sanity/image";

export interface ClothingItemType {
  _id: string;
  name: string;
  category: string;
  color: string;
  season?: string[];
  occasions?: string[];
  description?: string;
  image: any;
}

export default function ClothingCard({ item }: { item: ClothingItemType }) {
  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="aspect-[3/4] relative overflow-hidden bg-brand-50">
        {item.image && (
          <Image
            src={urlFor(item.image).width(600).height(800).url()}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-brand-500 uppercase tracking-wider font-medium">
          MAISON
        </p>
        <h3 className="font-medium text-gray-900 mt-1">{item.name}</h3>
        <span className="text-sm text-gray-500 capitalize mt-2 block">{item.category}</span>
        {item.occasions && item.occasions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.occasions.map((occasion) => (
              <span
                key={occasion}
                className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
              >
                {occasion}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
