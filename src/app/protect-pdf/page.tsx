import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { PasswordToolCard } from "@/components/password-tool-card";

const tool = getToolBySlug("protect-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function ProtectPdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<PasswordToolCard toolId={tool.id} />}
      steps={[
        ["Add your PDF", "Drag in the document you want to protect. It's validated before anything happens."],
        ["Choose a password", "Pick a password (4–64 characters), confirm it, and use show/hide to check it as you type."],
        ["Download the protected file", "The PDF is encrypted with standard AES-256 right in your browser, verified, and ready to download."],
      ]}
      notes={[
        "Protection uses standard PDF encryption (AES-256), so readers will ask for the password before opening.",
        "The password can't be recovered — if you forget it, the file can't be opened. Keep it somewhere safe.",
        "A protected PDF must be unlocked before tools like Merge can use it — the Unlock PDF tool handles that.",
        "Nothing is uploaded. Encryption happens entirely in your browser.",
      ]}
    />
  );
}