import { describe, expect, it } from "vitest";
import { PDFDocument, degrees } from "pdf-lib";
import { rotatePdf } from "./rotate";
import { splitPdf } from "./split";
import { organizePdf } from "./organize";
import { compressPdf } from "./compress";

async function makeDoc(pages: { size: [number, number]; rotate?: number }[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const p of pages) {
    const page = doc.addPage(p.size);
    if (p.rotate) page.setRotation(degrees(p.rotate));
  }
  return doc.save();
}

function toFile(bytes: Uint8Array, name = "doc.pdf"): File {
  return new File([bytes.buffer as ArrayBuffer], name, { type: "application/pdf" });
}

async function rotationOf(blob: Blob, index: number): Promise<number> {
  const doc = await PDFDocument.load(await blob.arrayBuffer());
  return doc.getPage(index).getRotation().angle;
}

const single = async (name = "doc.pdf", extraPages = 0) => {
  const sizes = Array.from({ length: 3 + extraPages }, (_, i) => [100 + i * 50, 150 + i * 50] as [number, number]);
  return { files: [{ name, file: toFile(await makeDoc(sizes.map((size) => ({ size }))), name) }], options: {} };
};

describe("rotatePdf", () => {
  it("rotates selected pages and leaves the rest untouched", async () => {
    const res = await rotatePdf(
      await single(),
      new AbortController().signal,
      () => {},
    );
    // rotate with no pages option -> whole doc
    const rotated = await rotatePdf(
      { ...(await single()), options: { degrees: "90" } },
      new AbortController().signal,
      () => {},
    );
    const whole = await rotationOf(rotated.outputs[0].blob, 0);
    expect(whole).toBe(90);
    const partial = await rotatePdf(
      { ...(await single()), options: { degrees: "270", pages: "2" } },
      new AbortController().signal,
      () => {},
    );
    expect(await rotationOf(partial.outputs[0].blob, 1)).toBe(270);
    expect(await rotationOf(partial.outputs[0].blob, 0)).toBe(0);
    expect(res.outputs[0].name).toBe("doc-rotated.pdf");
  });
});

describe("splitPdf", () => {
  it("splits into ordered ranges as real PDFs", async () => {
    const res = await splitPdf(
      { ...(await single("doc.pdf", 1)), options: { mode: "ranges", ranges: "1-2, 4" } },
      new AbortController().signal,
      () => {},
    );
    expect(res.outputs.map((o) => o.name)).toEqual(["split-001-002.pdf", "split-page-004.pdf"]);
    for (const o of res.outputs) {
      const doc = await PDFDocument.load(await o.blob.arrayBuffer());
      expect(doc.getPageCount()).toBeGreaterThan(0);
    }
    expect(res.outputs[0].size).toBeGreaterThan(0);
  });

  it("splits every page separately", async () => {
    const res = await splitPdf(
      { ...(await single("doc.pdf")), options: { mode: "pages" } },
      new AbortController().signal,
      () => {},
    );
    expect(res.outputs).toHaveLength(3);
    expect(res.outputs[0].name).toBe("split-page-001.pdf");
  });

  it("rejects an empty ranges spec in ranges mode", async () => {
    await expect(
      splitPdf({ ...(await single()), options: { mode: "ranges", ranges: "" } }, new AbortController().signal, () => {}),
    ).rejects.toThrow(/page ranges/);
  });
});

describe("organizePdf", () => {
  it("reorders and removes pages per the given order", async () => {
    const res = await organizePdf(
      { ...(await single("doc.pdf")), options: { order: "3, 1" } },
      new AbortController().signal,
      () => {},
    );
    const doc = await PDFDocument.load(await res.outputs[0].blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(2);
    expect(res.outputs[0].name).toBe("doc-organized.pdf");
    expect(res.note).toContain("1 total");
  });
});

describe("compressPdf", () => {
  it("returns the original unchanged with an honest note when rebuild is not smaller", async () => {
    const original = await makeDoc([{ size: [300, 300] }]);
    const res = await compressPdf(
      { files: [{ name: "doc.pdf", file: toFile(original) }], options: {} },
      new AbortController().signal,
      () => {},
    );
    // Either genuinely smaller (summary present) or original kept (note explains).
    if (res.summary) {
      expect(res.summary.find((s) => s.label === "Reduction")).toBeTruthy();
    } else {
      expect(res.note).toContain("not smaller");
      expect(res.outputs[0].blob.size).toBe(original.length);
    }
    const doc = await PDFDocument.load(await res.outputs[0].blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });

  it("offers the rebuilt file when it is genuinely smaller", async () => {
    // A document saved without object streams is structurally bigger; the
    // rebuild (object streams on) is genuinely smaller and must be offered.
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    const loose = await doc.save({ useObjectStreams: false });
    const res = await compressPdf(
      { files: [{ name: "doc.pdf", file: toFile(loose) }], options: {} },
      new AbortController().signal,
      () => {},
    );
    expect(res.summary?.find((s) => s.label === "Reduction")).toBeTruthy();
    expect(res.outputs[0].blob.size).toBeLessThan(loose.length);
    const reopened = await PDFDocument.load(await res.outputs[0].blob.arrayBuffer());
    expect(reopened.getPageCount()).toBe(1);
  });
});