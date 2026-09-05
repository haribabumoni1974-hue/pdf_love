import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { jpgToPdf } from "./jpg-to-pdf";
import { pdfToJpg } from "./pdf-to-jpg";
import { resolveRenderSetting } from "@/lib/pdf/render-jpgs";
import { looksLikeJpeg } from "@/lib/validation/validate-files";

// 1x1 white JPEG (valid, standard header).
const JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCgD//Z";
const jpegBytes = () => Buffer.from(JPEG_B64, "base64");

function jpegFile(name = "photo.jpg"): File {
  return new File([new Uint8Array(jpegBytes())], name, { type: "image/jpeg" });
}

describe("jpgToPdf", () => {
  it("embeds real JPEGs into a valid PDF with one page per image", async () => {
    const res = await jpgToPdf(
      {
        files: [
          { name: "a.jpg", file: jpegFile("a.jpg") },
          { name: "b.jpg", file: jpegFile("b.jpg") },
        ],
        options: {},
      },
      new AbortController().signal,
      () => {},
    );
    expect(res.outputs).toHaveLength(1);
    expect(res.outputs[0].name).toBe("a-images.pdf");
    const doc = await PDFDocument.load(await res.outputs[0].blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(2);
  });

  it("rejects a non-JPEG with an honest message", async () => {
    const fake = new File([new TextEncoder().encode("not a jpeg")], "fake.jpg", { type: "image/jpeg" });
    await expect(
      jpgToPdf({ files: [{ name: "fake.jpg", file: fake }], options: {} }, new AbortController().signal, () => {}),
    ).rejects.toThrow(/not a JPEG/);
  });
});

describe("jpeg sniffing", () => {
  it("detects JPEG magic bytes", async () => {
    expect(await looksLikeJpeg(jpegFile())).toBe(true);
    const text = new File([new TextEncoder().encode("nope")], "x.jpg", { type: "image/jpeg" });
    expect(await looksLikeJpeg(text)).toBe(false);
  });
});

describe("render settings", () => {
  it("resolves quality levels deterministically", () => {
    expect(resolveRenderSetting("low")).toEqual({ quality: 0.6, scale: 1 });
    expect(resolveRenderSetting("medium")).toEqual({ quality: 0.85, scale: 1.5 });
    expect(resolveRenderSetting("high")).toEqual({ quality: 0.95, scale: 2 });
    expect(resolveRenderSetting("bogus")).toEqual({ quality: 0.85, scale: 1.5 });
  });
});

describe("pdfToJpg guard", () => {
  it("refuses documents over the render cap before touching a canvas", async () => {
    // Node has no canvas, so the guard must reject before rendering.
    const doc = await PDFDocument.create();
    for (let i = 0; i < 60; i++) doc.addPage([200, 200]);
    const file = new File([new Uint8Array(await doc.save())], "big.pdf", { type: "application/pdf" });
    await expect(
      pdfToJpg({ files: [{ name: "big.pdf", file }], options: { level: "medium" } }, new AbortController().signal, () => {}),
    ).rejects.toThrow(/50 pages/);
  });
});