import type { OptionField } from "@/lib/types";

export const REMOVE_FIELDS: OptionField[] = [
  {
    key: "pages",
    label: "Pages to remove",
    kind: "text",
    placeholder: "e.g. 2, 5-8",
    hint: "Comma-separated pages and ranges. Removed pages are gone from the output only — your original file is untouched.",
  },
];