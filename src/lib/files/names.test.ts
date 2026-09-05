import { describe, expect, it } from "vitest";
import { mergedOutputName, numberedName, sanitizeBaseName, sanitizeFileName } from "./names";

describe("sanitizeBaseName", () => {
  it("strips the extension", () => {
    expect(sanitizeBaseName("report final.pdf")).toBe("report final");
  });

  it("removes dangerous filename characters", () => {
    expect(sanitizeBaseName('a<b>:c"d/e|f?.pdf')).toBe("abcdef");
  });

  it("collapses whitespace and trims", () => {
    expect(sanitizeBaseName("  draft    v2 .pdf")).toBe("draft v2");
  });

  it("falls back to a safe default", () => {
    expect(sanitizeBaseName("")).toBe("document");
    expect(sanitizeBaseName("...")).toBe("document");
  });
});

describe("sanitizeFileName", () => {
  it("preserves the extension", () => {
    expect(sanitizeFileName('bad:name.PDF')).toBe("badname.PDF");
  });
});

describe("output naming", () => {
  it("uses the tool naming convention", () => {
    expect(mergedOutputName()).toBe("merged.pdf");
  });

  it("zero-pads numbered outputs", () => {
    expect(numberedName("report.pdf", 1, "pdf")).toBe("report-001.pdf");
    expect(numberedName("report.pdf", 42, "jpg")).toBe("report-042.jpg");
  });
});