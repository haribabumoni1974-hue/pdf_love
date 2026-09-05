import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { ToolRunnerCard } from "@/components/tool-runner-card";
import { ROTATE_FIELDS } from "@/features/tools/rotate/fields";

const tool = getToolBySlug("rotate-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function RotatePdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<ToolRunnerCard toolId={tool.id} fields={ROTATE_FIELDS} />}
      steps={[
        ["Add your PDF", "Drag in the sideways document. Its page count is shown before you start."],
        ["Pick rotation & pages", "Choose 90°, 180° or 270°, and either the whole document or selected pages."],
        ["Download", "Get your rotated PDF — verified and ready to read the right way round."],
      ]}
      notes={[
        "Rotation is stored as a page property, so text stays selectable and no quality is lost.",
        "Pages you don't select keep their current orientation.",
        "Nothing is uploaded. Rotation happens entirely in your browser.",
      ]}
    />
  );
}