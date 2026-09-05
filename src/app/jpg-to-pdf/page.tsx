import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";

const tool = getToolBySlug("jpg-to-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function JpgToPdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} />}
      steps={[
        ["Add your JPGs", "Drag in one or more JPEG images. Each one is content-checked, not just renamed."],
        ["Put them in order", "Drag images into the order you want — each image becomes one PDF page."],
        ["Download", "Get a single PDF with every image at its original resolution."],
      ]}
      notes={[
        `Up to ${tool.validationRules.maxFiles} images (${tool.validationRules.maxFileSizeMB} MB each) are supported per run.`,
        "Images are embedded at native resolution — nothing is downscaled or re-compressed.",
        "Nothing is uploaded. Conversion happens entirely in your browser.",
      ]}
    />
  );
}