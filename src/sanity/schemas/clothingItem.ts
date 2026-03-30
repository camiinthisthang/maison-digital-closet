import { defineField, defineType } from "sanity";

export const clothingItem = defineType({
  name: "clothingItem",
  title: "Clothing Item",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
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
      type: "array",
      of: [{ type: "string" }],
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
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category",
      media: "image",
    },
  },
});
