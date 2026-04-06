// GROQ queries — this is how we fetch data from Sanity's Content Lake.
// GROQ is Sanity's query language (like GraphQL but different syntax).
// The key benefit: you write the query, Sanity returns the data. No REST API to build.

// Fetch all clothing items, newest first.
// The { _id, name, ... } part is a "projection" — it tells Sanity exactly which fields to return.
// Without the projection, you'd get everything (including internal metadata you don't need).
export const ALL_CLOTHING_QUERY = `*[_type == "clothingItem"] | order(_createdAt desc) {
  _id,
  name,
  category,
  color,
  season,
  occasions,
  description,
  image
}`;

// Fetch curated outfits with their referenced clothing items resolved.
// The "items[]-> { ... }" syntax follows references — each outfit stores an array of
// item IDs, and the -> tells GROQ to fetch the full item documents instead of just the IDs.
// This is like a JOIN in SQL, but built into the query language.
export const CURATED_OUTFITS_QUERY = `*[_type == "curatedOutfit"] {
  _id,
  name,
  occasion,
  curatorName,
  notes,
  "items": items[]-> {
    _id,
    name,
    category,
    color,
    season,
    occasions,
    description,
    image
  }
}`;

// Fetch items filtered by category — uses a $category parameter.
// Parameters (prefixed with $) prevent GROQ injection and let you reuse queries.
export const CLOTHING_BY_CATEGORY_QUERY = `*[_type == "clothingItem" && category == $category] | order(_createdAt desc) {
  _id,
  name,
  category,
  color,
  season,
  occasions,
  description,
  image
}`;
