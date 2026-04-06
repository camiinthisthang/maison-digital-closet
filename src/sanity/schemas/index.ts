// Schema index — every schema type must be imported here and added to the array.
// This array gets passed to sanity.config.ts → schema.types.
// If you create a new document type, you MUST add it here or Studio won't know about it.
import { clothingItem } from "./clothingItem";
import { curatedOutfit } from "./curatedOutfit";

export const schemaTypes = [clothingItem, curatedOutfit];
