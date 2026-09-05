import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";

const tool = getToolBySlug("compress-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function CompressPdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} />}
      steps={[
        ["Add your PDF", "Drag in the file — its size is recorded before anything happens."],
        ["Rebuild", "The document's internal structure is rebuilt to drop duplicated data."],
        ["See the honest result", "You always get real before/after sizes. If no reduction was possible, the original is returned unchanged."],
      ]}
      notes={[
        "This is a lossless rebuild: no text is rasterized and no images are re-encoded, so quality never changes.",
        "Because images are kept at full quality, gains are modest — typically most on files built from repeated edits.",
        "Nothing is uploaded. Compression happens entirely in your browser.",
      ]}
    />
  );
}