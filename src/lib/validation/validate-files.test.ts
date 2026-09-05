import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PDFDocument as CantoDoc } from "@cantoo/pdf-lib";
import type { ValidationRules } from "@/lib/types";
import { checkFileBasics, findDuplicate, inspectPdfFile, looksLikePdf, pageLimitIssue } from "./validate-files";

const RULES: ValidationRules = {
  extensions: ["pdf"],
  mimeTypes: ["application/pdf"],
  minFiles: 2,
  maxFiles: 10,
  maxFileSizeMB: 50,
  maxPagesPerFile: 500,
  maxPagesTotal: 2000,
};

const pdfBytes = () => PDFDocument.create().then((d) => d.save());

function pdfFile(name: string, bytes?: Uint8Array, type = "application/pdf"): File {
  const data = bytes ?? new Uint8Array(0);
  return new File([data.buffer as ArrayBuffer], name, { type });
}

describe("checkFileBasics", () => {
  it("accepts a well-formed PDF", async () => {
    expect(checkFileBasics(pdfFile("a.pdf", await pdfBytes()), RULES)).toBeNull();
  });

  it("rejects unsupported extensions", () => {
    const issue = checkFileBasics(pdfFile("notes.txt", new Uint8Array(), "text/plain"), RULES);
    expect(issue?.code).toBe("unsupported-type");
    expect(issue?.message).toContain("supported");
  });

  it("rejects files over the size limit with an actionable message", () => {
    const big = new File([new Uint8Array(51 * 1024 * 1024)], "big.pdf", { type: "application/pdf" });
    const issue = checkFileBasics(big, RULES);
    expect(issue?.code).toBe("too-large");
    expect(issue?.message).toContain("50 MB");
    expect(issue?.message).toContain("smaller");
  });

  it("flags a MIME type that contradicts the extension", () => {
    const issue = checkFileBasics(pdfFile("a.pdf", new Uint8Array(), "image/png"), RULES);
    expect(issue?.code).toBe("suspicious-type");
  });

  it("never trusts the extension alone (magic bytes)", async () => {
    const textNamedPdf = pdfFile("fake.pdf", new TextEncoder().encode("definitely not a pdf"));
    expect(await looksLikePdf(textNamedPdf)).toBe(false);
    expect(await looksLikePdf(pdfFile("real.pdf", new TextEncoder().encode("%PDF-1.7 ...")))).toBe(true);
  });
});

describe("inspectPdfFile", () => {
  it("parses a real PDF and reports its page count", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    doc.addPage([300, 300]);
    const file = pdfFile("real.pdf", await doc.save());
    const result = await inspectPdfFile(file);
    expect(result).toEqual({ status: "valid", pageCount: 2 });
  });

  it("explains when a file named .pdf is not a PDF", async () => {
    const result = await inspectPdfFile(pdfFile("corrupt.pdf", new TextEncoder().encode("garbage")));
    expect(result.status).toBe("unreadable");
  });

  it("detects a password-protected PDF as encrypted", async () => {
    const doc = await CantoDoc.create();
    doc.addPage([200, 200]);
    doc.encrypt({ userPassword: "secret1", ownerPassword: "secret1", algorithm: "AES-256" });
    const result = await inspectPdfFile(pdfFile("locked.pdf", await doc.save()));
    expect(result.status).toBe("password-protected");
  });
});

describe("duplicates, limits, page limits", () => {
  it("detects duplicates by name + size", () => {
    const file = pdfFile("a.pdf");
    expect(findDuplicate(file, [{ name: "a.pdf", size: 0 }])).toBe(true);
    expect(findDuplicate(file, [{ name: "a.pdf", size: 1 }])).toBe(false);
  });

  it("gives an actionable page-limit message", () => {
    const issue = pageLimitIssue("huge.pdf", 500);
    expect(issue.code).toBe("too-many-pages");
    expect(issue.message).toContain("500");
  });
});