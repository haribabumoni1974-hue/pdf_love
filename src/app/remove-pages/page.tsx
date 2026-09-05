import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";
import { REMOVE_FIELDS } from "@/features/tools/remove-pages/fields";

const tool = getToolBySlug("remove-pages");
export const metadata: Metadata = toolMetadata(tool);

export default function RemovePagesPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} fields={REMOVE_FIELDS} />}
      steps={[
        ["Add your PDF", "Drag in the document and check the page count."],
        ["Choose pages to remove", "Write pages and ranges like 2, 5-8. Only the output is affected."],
        ["Download", "Get the cleaned-up PDF. Your original file stays exactly as it was."],
      ]}
      notes={[
        "Removal applies to the output copy only — your original file on disk is never changed.",
        "Removing every page is blocked with a clear message instead of producing an empty PDF.",
        "Nothing is uploaded. Removal happens entirely in your browser.",
      ]}
    />
  );
}