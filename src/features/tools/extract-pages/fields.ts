import type { OptionField } from "@/lib/types";

export const EXTRACT_FIELDS: OptionField[] = [
  {
    key: "pages",
    label: "Pages to extract",
    kind: "text",
    placeholder: "e.g. 1-3, 7, 10-12",
    hint: "Comma-separated pages and ranges. The new PDF contains exactly these pages.",
  },
];