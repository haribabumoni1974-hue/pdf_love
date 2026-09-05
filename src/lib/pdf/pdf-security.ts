import { PDFDocument } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist";
import { ensurePdfWorker } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";

/**
 * Genuine PDF encryption/decryption for the browser, built on @cantoo/pdf-lib
 * (a maintained fork of pdf-lib that implements ISO 32000-2 encryption) and
 * pdf.js. Everything runs locally; nothing is uploaded.
 *
 * Encrypt: standard AES-256 (V=5, R=6) — the only algorithm ISO 32000-2 still
 * recommends. Output needs the user password in any conforming reader.
 *
 * Decrypt: supported for standard security handlers (V 1/2/4/5). The decrypted
 * document is rebuilt by copying pages into a brand-new PDF, which guarantees
 * the output has no leftover /Encrypt metadata and remains fully valid.
 */

export const PROTECT_ALGORITHM = "AES-256" as const;

/** Encrypt a PDF with the given user password using standard AES-256. */
export async function encryptPdf(
  bytes: Uint8Array,
  password: string,
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, {});
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/encrypted/i.test(msg)) {
      throw new ToolError(
        "This PDF is already password-protected. Unlock it first (Unlock PDF tool) — a protected file can't be protected again as-is.",
      );
    }
    throw new ToolError("This PDF could not be read. It may be corrupted or unsupported.");
  }
  const pageCount = doc.getPageCount();
  try {
    doc.encrypt({
      userPassword: password,
      ownerPassword: password,
      algorithm: PROTECT_ALGORITHM,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/PDF\/A/i.test(msg)) {
      throw new ToolError(
        "This document is marked as PDF/A, which forbids encryption. pdf_love can't password-protect PDF/A files — try converting or using a different source file.",
      );
    }
    throw new ToolError(`Password protection could not be applied (${msg || "unknown reason"}).`);
  }
  const outBytes = await doc.save();
  return { bytes: outBytes, pageCount };
}

/**
 * Decrypt a standard encrypted PDF and rebuild it as a clean, unencrypted
 * document by copying every page into a fresh PDF. Text, images and layout are
 * preserved; bookmarks and form data are not carried over (same trade-off as
 * every rebuild tool in this app).
 */
/**
 * Decrypt a standard encrypted PDF and rebuild it as a clean, unencrypted
 * document. Failures are left raw here and classified by the processor so
 * that every failure path (load, rebuild, save) gets a precise message.
 */
export async function decryptPdfAndRebuild(
  bytes: Uint8Array,
  password: string,
): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const doc = await PDFDocument.load(bytes, { password });
  const pageCount = doc.getPageCount();
  // Rebuild into a fresh document so no /Encrypt entry (even an orphaned one)
  // survives in the output.
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, doc.getPageIndices());
  for (const page of pages) out.addPage(page);
  const outBytes = await out.save();
  return { bytes: outBytes, pageCount };
}

/** Turn a decryption failure into a specific, honest, human message. */
export function classifyDecryptFailure(err: unknown): ToolError {
  const msg = err instanceof Error ? err.message : String(err);
  if (/password incorrect/i.test(msg)) {
    return new ToolError("That password is incorrect for this PDF. Double-check it and try again.");
  }
  if (/unknown encryption method|unsupported encryption algorithm|invalid key length/i.test(msg)) {
    return new ToolError(
      "This PDF uses an encryption method that pdf_love cannot currently decrypt in the browser. Try a file protected with standard PDF encryption.",
    );
  }
  return new ToolError(
    `This PDF could not be decrypted (${msg || "unknown reason"}). It may be corrupted or use unsupported features.`,
  );
}

/** Re-open a PDF with pdf.js using a password; resolves with the page count. */
export async function openPdfWithPassword(blob: Blob, password: string): Promise<number> {
  ensurePdfWorker();
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = getDocument({ data, password, useWorkerFetch: false, disableAutoFetch: true });
  try {
    const doc = await task.promise;
    const pages = doc.numPages;
    await task.destroy();
    return pages;
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "";
    if (name === "PasswordException") {
      throw new ToolError("The password is incorrect for this PDF.");
    }
    throw new ToolError("The generated file could not be re-read to verify it. Please try again.");
  } finally {
    try {
      await task.destroy();
    } catch {
      /* already destroyed */
    }
  }
}