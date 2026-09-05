import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";
import { EXTRACT_FIELDS } from "@/features/tools/extract-pages/fields";

const tool = getToolBySlug("extract-pages");
export const metadata: Metadata = toolMetadata(tool);

export default function ExtractPagesPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} fields={EXTRACT_FIELDS} />}
      steps={[
        ["Add your PDF", "Drag in the source document; its page count is shown."],
        ["Enter the pages you need", "Write pages and ranges like 1-3, 7, 10-12 — anything else is left out."],
        ["Download", "Get a new PDF containing exactly the pages you selected."],
      ]}
      notes={[
        "Ranges are validated against the document, and out-of-range pages produce a clear message.",
        "The original document is not modified.",
        "Nothing is uploaded. Extraction happens entirely in your browser.",
      ]}
    />
  );
}