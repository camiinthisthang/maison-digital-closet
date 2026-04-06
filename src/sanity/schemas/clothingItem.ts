import { defineField, defineType } from "sanity";

// This is the core schema — it defines the structure of every clothing item in Sanity.
// Sanity auto-generates the Studio UI from this definition.
// Every field here becomes a form field in Studio AND a queryable column in the Content Lake.
export const clothingItem = defineType({
  name: "clothingItem", // Internal ID used in GROQ queries: *[_type == "clothingItem"]
  title: "Clothing Item", // Display name in Studio sidebar
  type: "document", // "document" = top-level content type (vs "object" which is embedded)
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      // validation: rule.required() means Studio shows an error if this field is empty.
      // The document can still be saved as a draft, but can't be Published without it.
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      // options.list turns this into a dropdown picker in Studio.
      // The "value" is what gets stored in the Content Lake (and what GROQ queries match against).
      // The "title" is just the human-readable label shown in the dropdown.
      options: {
        list: [
          { title: "Tops", value: "tops" },
          { title: "Bottoms", value: "bottoms" },
          { title: "Dresses", value: "dresses" },
          { title: "Outerwear", value: "outerwear" },
          { title: "Shoes", value: "shoes" },
          { title: "Accessories", value: "accessories" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "season",
      title: "Season",
      type: "array", // "array" of strings = multi-select checkboxes in Studio
      of: [{ type: "string" }],
      // When an array field has options.list, Studio renders checkboxes instead of a text input.
      // A single item can belong to multiple seasons (e.g. a jacket: fall + winter).
      options: {
        list: [
          { title: "Spring", value: "spring" },
          { title: "Summer", value: "summer" },
          { title: "Fall", value: "fall" },
          { title: "Winter", value: "winter" },
        ],
      },
    }),
    defineField({
      name: "occasions",
      title: "Occasions",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Casual", value: "casual" },
          { title: "Formal", value: "formal" },
          { title: "Business", value: "business" },
          { title: "Party", value: "party" },
          { title: "Outdoor", value: "outdoor" },
          { title: "Date Night", value: "date-night" },
          { title: "Wedding", value: "wedding" },
          { title: "Brunch", value: "brunch" },
        ],
      },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text", // "text" = multi-line textarea (vs "string" which is single-line)
      rows: 3, // How tall the textarea appears in Studio
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        // hotspot: true lets editors pick a focal point on the image.
        // When the image gets cropped at different sizes (e.g. thumbnail vs full),
        // it crops around the hotspot instead of center-cropping.
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
  ],
  // preview: controls how this document appears in the Studio list view.
  // Without this, items would just show "Untitled" in the sidebar.
  preview: {
    select: {
      title: "name", // Show the "name" field as the list title
      subtitle: "category", // Show "category" below it
      media: "image", // Show the uploaded image as a thumbnail
    },
  },
});
