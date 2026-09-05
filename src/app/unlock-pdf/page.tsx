import type { Metadata } from "next";
import { getToolBySlug } from "@/config/tools";
import { toolMetadata } from "@/lib/seo";
import { ToolPage } from "@/components/tool-page";
import { PasswordToolCard } from "@/components/password-tool-card";

const tool = getToolBySlug("unlock-pdf");
export const metadata: Metadata = toolMetadata(tool);

export default function UnlockPdfPage() {
  return (
    <ToolPage
      tool={tool}
      card={<PasswordToolCard toolId={tool.id} />}
      steps={[
        ["Add your password-protected PDF", "Drag in the encrypted document. It's detected automatically as requiring a password."],
        ["Enter the password", "Type the password (show/hide to check it) and unlock — the file is decrypted in your browser."],
        ["Download the unlocked file", "The result is a freshly rebuilt PDF that opens without a password, verified before download."],
      ]}
      notes={[
        "Only unlock documents you own or have permission to modify.",
        "Common standard encryption (RC4 and AES, including AES-256) is supported. Unsupported methods are detected and explained honestly instead of producing a broken file.",
        "The unlocked file is rebuilt cleanly — text and images are preserved; bookmarks and form data are not carried over.",
        "Nothing is uploaded. Decryption happens entirely in your browser.",
      ]}
    />
  );
}