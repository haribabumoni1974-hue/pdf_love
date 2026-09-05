import type { OptionField } from "@/lib/types";

export const SPLIT_FIELDS: OptionField[] = [
  {
    key: "mode",
    label: "Split by",
    kind: "select",
    default: "ranges",
    values: [
      { value: "ranges", label: "Page ranges (e.g. 1-3, 5-8)" },
      { value: "pages", label: "Each page separately" },
    ],
  },
  {
    key: "ranges",
    label: "Ranges",
    kind: "text",
    placeholder: "e.g. 1-3, 5-8",
    hint: "Comma-separated ranges; each range becomes its own PDF. Not needed for 'each page separately'.",
  },
];