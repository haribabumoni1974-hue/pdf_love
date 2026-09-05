import type { OptionField } from "@/lib/types";

export const ROTATE_FIELDS: OptionField[] = [
  {
    key: "degrees",
    label: "Rotate by",
    kind: "select",
    default: "90",
    values: [
      { value: "90", label: "90° clockwise" },
      { value: "180", label: "180°" },
      { value: "270", label: "270° clockwise" },
    ],
  },
  {
    key: "pages",
    label: "Pages",
    kind: "text",
    placeholder: "Leave blank to rotate every page",
    hint: "Which pages to rotate, e.g. 1, 3-5. Blank rotates the whole document.",
  },
];