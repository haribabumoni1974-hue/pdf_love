import type { OptionField } from "@/lib/types";

export const PDF_TO_JPG_FIELDS: OptionField[] = [
  {
    key: "level",
    label: "Image quality",
    kind: "select",
    default: "medium",
    values: [
      { value: "low", label: "Low — smaller files" },
      { value: "medium", label: "Medium — balanced" },
      { value: "high", label: "High — sharpest" },
    ],
    hint: "Trade-off between JPEG file size and sharpness. Every page is rendered and exported as a real JPG.",
  },
];