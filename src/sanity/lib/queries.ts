export const ALL_CLOTHING_QUERY = `*[_type == "clothingItem"] | order(_createdAt desc) {
  _id,
  name,
  category,
  color,
  season,
  occasions,
  description,
  image,
  price
}`;

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

export const CLOTHING_BY_CATEGORY_QUERY = `*[_type == "clothingItem" && category == $category] | order(_createdAt desc) {
  _id,
  name,
  category,
  color,
  season,
  occasions,
  description,
  image,
  price
}`;
