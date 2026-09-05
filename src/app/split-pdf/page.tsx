import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";
import { SPLIT_FIELDS } from "@/features/tools/split/fields";

const tool = getToolBySlug("split-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function SplitPdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} fields={SPLIT_FIELDS} />}
      steps={[
        ["Add your PDF", "Drag in the PDF you want to divide. It's validated and its page count is shown."],
        ["Choose how to split", "Split every page into its own file, or write ranges like 1-3, 5-8 for grouped parts."],
        ["Download the parts", "Each part is a real, verified PDF — download them individually."],
      ]}
      notes={[
        `Files up to ${tool.validationRules.maxFileSizeMB} MB are supported; page ranges are validated against the document.`,
        "Up to 100 output files per run keeps browser memory in check — pick wider ranges for large documents.",
        "Nothing is uploaded. Splitting happens entirely in your browser.",
      ]}
    />
  );
}