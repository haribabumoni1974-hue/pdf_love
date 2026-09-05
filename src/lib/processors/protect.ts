import type { Processor } from "@/lib/types";
import { encryptPdf, openPdfWithPassword, PROTECT_ALGORITHM } from "@/lib/pdf/pdf-security";
import { inspectPdf } from "@/lib/pdf/parse-pdf";
import { derivedName } from "@/lib/pdf/pdf-ops";
import { AbortError, ToolError } from "@/lib/processing/errors";
import { validateProtectPassword } from "@/lib/validation/password";

/**
 * Protect a PDF with a real password. Uses standard AES-256 encryption
 * (@cantoo/pdf-lib, ISO 32000-2 V=5/R=6) and then verifies the result from
 * two independent directions:
 *  - pdf.js must refuse to open the output without a password, and
 *  - pdf.js must open it with the password, with the original page count.
 */
export const protectPdf: Processor = async ({ files, options }, signal, onProgress) => {
  const f = files[0];
  const password = String(options.password ?? "");
  const confirm = String(options.confirmPassword ?? "");
  const pwError = validateProtectPassword(password, confirm);
  if (pwError) throw new ToolError(pwError);

  onProgress({ stage: "processing", message: "Reading the PDF…" });
  const bytes = new Uint8Array(await f.file.arrayBuffer());
  if (signal.aborted) throw new AbortError();

  onProgress({ stage: "processing", message: `Encrypting with ${PROTECT_ALGORITHM}…` });
  const { bytes: encBytes, pageCount } = await encryptPdf(bytes, password);
  if (signal.aborted) throw new AbortError();
  const blob = new Blob([encBytes.buffer as ArrayBuffer], { type: "application/pdf" });

  onProgress({ stage: "finalizing", message: "Verifying the protection…" });
  // Verification 1: the output must genuinely require a password to open.
  let encryptedState: boolean;
  try {
    encryptedState = (await inspectPdf(blob)).encrypted;
  } catch {
    throw new ToolError("The generated file couldn't be verified as encrypted — please try again.");
  }
  if (!encryptedState) {
    throw new ToolError("The generated file is not actually encrypted — protection failed. Please try again.");
  }
  // Verification 2: the password opens it and the page count is intact.
  const openedPages = await openPdfWithPassword(blob, password);
  if (openedPages !== pageCount) {
    throw new ToolError(
      "Output verification failed: the protected file's pages don't match the original. Please try again.",
    );
  }

  return {
    outputs: [{ name: derivedName(f.name, "protected"), blob, size: blob.size, kind: "pdf" }],
    summary: [
      { label: "Encryption", value: PROTECT_ALGORITHM },
      { label: "Pages", value: String(pageCount) },
    ],
    note: `Your PDF now needs the password to open. ${PROTECT_ALGORITHM} is standard PDF encryption — a strong deterrent, though no encryption is absolute. The password can't be recovered, so keep it safe.`,
  };
};

export default protectPdf;