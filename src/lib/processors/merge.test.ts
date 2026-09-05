import { describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { mergePdfs } from "./merge";
import { AbortError } from "@/lib/processing/errors";

async function makeDoc(pages: { width: number; height: number }[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const p of pages) doc.addPage([p.width, p.height]);
  return doc.save();
}

function toFile(bytes: Uint8Array, name: string): File {
  return new File([bytes.buffer as ArrayBuffer], name, { type: "application/pdf" });
}

describe("mergePdfs", () => {
  it("merges real PDFs in the given order into a valid output", async () => {
    const [aBytes, bBytes] = await Promise.all([
      makeDoc([{ width: 200, height: 200 }, { width: 400, height: 300 }]),
      makeDoc([{ width: 300, height: 100 }]),
    ]);
    const onProgress = vi.fn();

    const result = await mergePdfs(
      {
        files: [
          { name: "a.pdf", file: toFile(aBytes, "a.pdf") },
          { name: "b.pdf", file: toFile(bBytes, "b.pdf") },
        ],
        options: {},
      },
      new AbortController().signal,
      onProgress,
    );

    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].name).toBe("merged.pdf");
    expect(result.outputs[0].blob.type).toBe("application/pdf");

    // Re-open the generated file with an independent parser: page count and
    // per-page order must match the input order exactly.
    const reopened = await PDFDocument.load(await result.outputs[0].blob.arrayBuffer());
    expect(reopened.getPageCount()).toBe(3);
    const sizes = [0, 1, 2].map((i) => {
      const s = reopened.getPage(i).getSize();
      return [s.width, s.height];
    });
    expect(sizes).toEqual([
      [200, 200],
      [400, 300],
      [300, 100],
    ]);
  });

  it("reports real per-file progress", async () => {
    const bytes = await makeDoc([{ width: 200, height: 200 }]);
    const onProgress = vi.fn();
    await mergePdfs(
      {
        files: [
          { name: "a.pdf", file: toFile(bytes, "a.pdf") },
          { name: "b.pdf", file: toFile(bytes, "b.pdf") },
        ],
        options: {},
      },
      new AbortController().signal,
      onProgress,
    );
    const updates = onProgress.mock.calls.map(([u]) => u);
    const step = updates.find((u) => u.current === 2 && u.total === 2);
    expect(step?.message).toContain("b.pdf");
    expect(updates.some((u) => u.stage === "finalizing")).toBe(true);
  });

  it("requires at least two files", async () => {
    const bytes = await makeDoc([{ width: 200, height: 200 }]);
    await expect(
      mergePdfs(
        { files: [{ name: "a.pdf", file: toFile(bytes, "a.pdf") }], options: {} },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow("at least two");
  });

  it("stops work when the operation is aborted", async () => {
    const bytes = await makeDoc([{ width: 200, height: 200 }]);
    const controller = new AbortController();
    controller.abort();
    await expect(
      mergePdfs(
        {
          files: [
            { name: "a.pdf", file: toFile(bytes, "a.pdf") },
            { name: "b.pdf", file: toFile(bytes, "b.pdf") },
          ],
          options: {},
        },
        controller.signal,
        () => {},
      ),
    ).rejects.toBeInstanceOf(AbortError);
  });

  it("gives an actionable message for encrypted input", async () => {
    // pdf-lib can't write encrypted PDFs, so simulate the loader rejecting one.
    const bytes = await makeDoc([{ width: 200, height: 200 }]);
    const loadSpy = vi.spyOn(PDFDocument, "load").mockRejectedValueOnce(new Error("Encrypted PDF"));
    await expect(
      mergePdfs(
        {
          files: [
            { name: "locked.pdf", file: toFile(bytes, "locked.pdf") },
            { name: "b.pdf", file: toFile(bytes, "b.pdf") },
          ],
          options: {},
        },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/Unlock PDF/);
    loadSpy.mockRestore();
  });
});