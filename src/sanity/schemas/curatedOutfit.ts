import { defineField, defineType } from "sanity";

export const curatedOutfit = defineType({
  name: "curatedOutfit",
  title: "Curated Outfit",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Outfit Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "occasion",
      title: "Occasion",
      type: "string",
      options: {
        list: [
          { title: "Casual Day", value: "casual" },
          { title: "Date Night", value: "date-night" },
          { title: "Night Out / Party", value: "party" },
          { title: "Brunch", value: "brunch" },
          { title: "Business / Work", value: "business" },
          { title: "Vacation", value: "vacation" },
          { title: "Formal / Event", value: "formal" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "items",
      title: "Outfit Pieces",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "clothingItem" }],
        },
      ],
      validation: (rule) => rule.required().min(2).max(6),
    }),
    defineField({
      name: "curatorName",
      title: "Curated By",
      type: "string",
    }),
    defineField({
      name: "notes",
      title: "Styling Notes",
      type: "text",
      rows: 2,
      description: "Why do these pieces work together?",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "curatorName",
    },
    prepare(selection) {
      return {
        title: selection.title,
        subtitle: selection.subtitle
          ? `by ${selection.subtitle}`
          : "Curated outfit",
      };
    },
  },
});
