import type { Processor } from "@/lib/types";
import { classifyDecryptFailure, decryptPdfAndRebuild } from "@/lib/pdf/pdf-security";
import { inspectPdf, verifyPdfOutput } from "@/lib/pdf/parse-pdf";
import { derivedName } from "@/lib/pdf/pdf-ops";
import { AbortError, ToolError } from "@/lib/processing/errors";
import { validateUnlockPassword } from "@/lib/validation/password";

/**
 * Remove a known password from a PDF. Detection is done with pdf.js; real
 * decryption uses @cantoo/pdf-lib's standard security handler support, and the
 * decrypted document is rebuilt as a fresh, unencrypted PDF. The output is
 * verified by re-opening it with pdf.js *without* a password.
 */
export const unlockPdf: Processor = async ({ files, options }, signal, onProgress) => {
  const f = files[0];
  const password = String(options.password ?? "");
  const pwError = validateUnlockPassword(password);
  if (pwError) throw new ToolError(pwError);

  onProgress({ stage: "processing", message: "Checking the file…" });
  const info = await inspectPdf(f.file);
  if (!info.encrypted) {
    throw new ToolError("This PDF is not password-protected, so there is nothing to unlock.");
  }
  if (signal.aborted) throw new AbortError();

  onProgress({ stage: "processing", message: "Decrypting the document…" });
  const bytes = new Uint8Array(await f.file.arrayBuffer());
  let outBytes: Uint8Array;
  let pageCount: number;
  try {
    ({ bytes: outBytes, pageCount } = await decryptPdfAndRebuild(bytes, password));
  } catch (err) {
    throw classifyDecryptFailure(err);
  }
  if (signal.aborted) throw new AbortError();
  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });

  onProgress({ stage: "finalizing", message: "Verifying the unlocked file…" });
  // pdf.js must open the output WITHOUT a password and with the right page count.
  await verifyPdfOutput(blob, pageCount);
  const raw = await blob.text();
  if (raw.includes("/Encrypt")) {
    throw new ToolError("The unlocked output still contains encryption metadata — please try again.");
  }

  return {
    outputs: [{ name: derivedName(f.name, "unlocked"), blob, size: blob.size, kind: "pdf" }],
    summary: [
      { label: "Pages", value: String(pageCount) },
      { label: "Encryption", value: "Removed" },
    ],
    note: "The unlocked file is a freshly rebuilt PDF with no password. Text and images are preserved; bookmarks and form data are not carried over. Only unlock documents you own or are allowed to modify.",
  };
};

export default unlockPdf;