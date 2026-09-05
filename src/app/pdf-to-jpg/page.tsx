import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";
import { PDF_TO_JPG_FIELDS } from "@/features/tools/pdf-to-jpg/fields";

const tool = getToolBySlug("pdf-to-jpg");
export const metadata: Metadata = toolMetadata(tool);

export default function PdfToJpgPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} fields={PDF_TO_JPG_FIELDS} />}
      steps={[
        ["Add your PDF", "Drag in the document. Pages are counted before conversion."],
        ["Pick a quality", "Low, Medium or High trades JPEG size against sharpness."],
        ["Download the images", "Every page is rendered from the real PDF and exported as a JPG — previews included."],
      ]}
      notes={[
        "Pages are rendered with pdf.js, so output reflects the actual page content.",
        "Documents over 50 pages are refused with a clear message to protect browser memory.",
        "JPGs are images of pages — text is no longer selectable in the output.",
        "Nothing is uploaded. Conversion happens entirely in your browser.",
      ]}
    />
  );
}