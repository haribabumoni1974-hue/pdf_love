import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { extractPages, removePages } from "./pages";
import { parsePageSpec } from "@/lib/pdf/page-selection";

async function makeDoc(sizes: number[][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const [w, h] of sizes) doc.addPage([w, h]);
  return doc.save();
}

function toFile(bytes: Uint8Array, name = "doc.pdf"): File {
  return new File([bytes.buffer as ArrayBuffer], name, { type: "application/pdf" });
}

async function sizesOf(blob: Blob): Promise<number[][]> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPages().map((p) => {
    const s = p.getSize();
    return [s.width, s.height];
  });
}

const input = { files: [{ name: "doc.pdf", file: toFile(await makeDoc([[100, 100], [200, 200], [300, 300], [400, 400]])) }], options: {} };

describe("parsePageSpec", () => {
  it("parses mixed pages and ranges", () => {
    expect(parsePageSpec("3, 1-2, 7-8", 10)).toEqual([1, 2, 3, 7, 8]);
  });

  it("rejects out-of-range pages with an actionable message", () => {
    expect(() => parsePageSpec("1-9", 5)).toThrow(/has 5 pages/);
  });

  it("rejects malformed tokens", () => {
    expect(() => parsePageSpec("x", 5)).toThrow(/isn't a valid page/);
  });
});

describe("extractPages", () => {
  it("builds a real PDF containing only the selected pages in document order", async () => {
    const res = await extractPages({ ...input, options: { pages: "4, 2" } }, new AbortController().signal, () => {});
    expect(res.outputs[0].name).toBe("doc-extracted-pages.pdf");
    const sizes = await sizesOf(res.outputs[0].blob);
    expect(sizes).toEqual([[200, 200], [400, 400]]);
  });
});

describe("removePages", () => {
  it("removes selected pages and keeps the rest in order", async () => {
    const res = await removePages({ ...input, options: { pages: "2-3" } }, new AbortController().signal, () => {});
    const sizes = await sizesOf(res.outputs[0].blob);
    expect(sizes).toEqual([[100, 100], [400, 400]]);
    expect(res.outputs[0].name).toBe("doc-removed-pages.pdf");
  });

  it("refuses to remove the entire document", async () => {
    await expect(
      removePages({ ...input, options: { pages: "1-4" } }, new AbortController().signal, () => {}),
    ).rejects.toThrow(/entire document/);
  });
});