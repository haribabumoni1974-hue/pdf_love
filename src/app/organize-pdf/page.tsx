import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { OrganizeCard } from "@/components/organize-card";

const tool = getToolBySlug("organize-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function OrganizePdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<OrganizeCard toolId={tool.id} />}
      steps={[
        ["Add your PDF", "Drag in the document — its pages are read straight away."],
        ["Arrange the order", "Move pages up and down with the arrows, and remove the ones you don't want."],
        ["Apply & download", "The output follows your order exactly; removed pages are left out."],
      ]}
      notes={[
        "The order controls a copy of your document — the original file is untouched.",
        "Removing a page here simply means leaving it out of the new order.",
        "Nothing is uploaded. Organizing happens entirely in your browser.",
      ]}
    />
  );
}