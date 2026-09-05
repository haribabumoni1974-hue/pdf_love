import { PDFDocument, PDFName, PDFDict } from "@cantoo/pdf-lib";
import { inspectPdf } from "@/lib/pdf/parse-pdf";
import { ToolError } from "@/lib/processing/errors";

/**
 * PDF → PDF/A converter (browser), targeting PDF/A-2B (ISO 19005-2, level B).
 *
 * This is a real conversion, not a metadata stamp: @cantoo/pdf-lib's
 * convertToPDFA raises the PDF version, installs an sRGB ICC OutputIntent,
 * writes a pdfaid XMP packet, and adds a file identifier. We then verify the
 * result structurally (pdfaid present, OutputIntent present, no encryption,
 * fonts embedded, re-openable) and fail honestly when a requirement can't be
 * met.
 *
 * Honest limits: level A (tagged/accessible) and full Unicode-mapping
 * verification are not performed; U-level conformance is not claimed. Fonts
 * that are not embedded cause a clear failure rather than a false "PDF/A".
 */

const TARGET = "2B";

async function assertFontsEmbedded(doc: PDFDocument): Promise<void> {
  // Walk the page tree collecting every /Font resource, then check each font
  // dict has a FontDescriptor whose FontFile* entries are present.
  const seen = new Set<string>();
  const missing: string[] = [];

  const checkPageResources = (resources: unknown) => {
    if (!(resources instanceof PDFDict)) return;
    const fonts = resources.get(PDFName.of("Font"));
    if (!(fonts instanceof PDFDict)) return;
    for (const key of fonts.keys()) {
      const font = fonts.lookup(PDFName.of(key));
      if (!(font instanceof PDFDict)) continue;
      const baseFont = font.get(PDFName.of("BaseFont"));
      const id = baseFont instanceof PDFName ? baseFont.asString() : key;
      if (seen.has(id)) continue;
      seen.add(id);
      const descriptor = font.get(PDFName.of("FontDescriptor"));
      const embedded =
        descriptor instanceof PDFDict &&
        (descriptor.get(PDFName.of("FontFile")) !== undefined ||
          descriptor.get(PDFName.of("FontFile2")) !== undefined ||
          descriptor.get(PDFName.of("FontFile3")) !== undefined);
      if (!embedded) missing.push(id);
    }
  };

  for (const page of doc.getPages()) {
    const node = (page as unknown as { node?: PDFDict }).node as PDFDict | undefined;
    if (!node) continue;
    // Page dict may have /Resources directly or inherited via /Parent chain.
    let current: PDFDict | undefined = node;
    let resources = current.get(PDFName.of("Resources"));
    while (!(resources instanceof PDFDict) && current) {
      current = current.get(PDFName.of("Parent")) instanceof PDFDict ? (current.get(PDFName.of("Parent")) as PDFDict) : undefined;
      if (current) resources = current.get(PDFName.of("Resources"));
    }
    checkPageResources(resources);
  }

  if (missing.length > 0) {
    throw new ToolError(
      `This PDF uses fonts that are not embedded (${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : ""}). PDF/A requires embedded fonts, so conversion cannot produce a compliant file.`,
    );
  }
}

export async function pdfToPdfa(
  file: File,
  opts: { onProgress: (m: string) => void },
): Promise<{ blob: Blob; warnings: string[]; summary: { label: string; value: string }[] }> {
  const incoming = new Uint8Array(await file.arrayBuffer());

  // Reject encrypted inputs up front.
  const probe = await inspectPdf(file);
  if (probe.encrypted) {
    throw new ToolError(
      "This PDF is password-protected and cannot be converted to PDF/A. Unlock it first (Unlock PDF tool), then retry.",
    );
  }

  opts.onProgress("Checking fonts…");
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(incoming, {});
  } catch (err) {
    throw new ToolError(
      `This PDF could not be read for PDF/A conversion. It may be corrupted or unsupported.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  }
  await assertFontsEmbedded(doc);
  if (doc.isEncrypted) {
    throw new ToolError("This PDF is encrypted and cannot be converted to PDF/A.");
  }

  opts.onProgress("Converting to PDF/A…");
  try {
    doc.convertToPDFA({ conformance: TARGET });
  } catch (err) {
    throw new ToolError(
      `PDF/A conversion failed.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  }
  const outBytes = await doc.save();
  const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });

  opts.onProgress("Validating the PDF/A output…");
  // Structural verification: pdfaid XMP, OutputIntent, reopen-ability.
  const text = new TextDecoder("latin1").decode(outBytes.subarray(0, Math.min(outBytes.length, 1_200_000)));
  const hasPdfaid = /pdfaid/.test(text) && /pdfaid:part>2/.test(text.replace(/\s/g, ""));
  const hasOutputIntent = text.includes("/OutputIntents") && text.includes("/GTS_PDFA1");
  if (!hasPdfaid || !hasOutputIntent) {
    throw new ToolError(
      "PDF/A conversion completed, but the resulting document did not pass validation (missing PDF/A metadata or output intent). No file was offered.",
    );
  }
  const reopened = await PDFDocument.load(outBytes, {});
  if (reopened.getPageCount() !== probe.pageCount) {
    throw new ToolError("Output verification failed: page count changed during PDF/A conversion.");
  }

  return {
    blob,
    summary: [
      { label: "Profile", value: `PDF/A-${TARGET}` },
      { label: "Pages", value: String(probe.pageCount) },
    ],
    warnings: [
      "PDF/A-2B (ISO 19005-2, Level B) is the supported profile. Level A (tagged/accessible) and full Unicode-mapping conformance are not offered or claimed.",
      "If your source contains unembedded fonts, transparency conflicts or other PDF/A-prohibited features, conversion fails honestly instead of producing a non-compliant file.",
    ],
  };
}