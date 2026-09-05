import { describe, expect, it } from "vitest";
import { PDFDocument as CantoDoc } from "@cantoo/pdf-lib";
import { protectPdf } from "./protect";
import { inspectPdf } from "@/lib/pdf/parse-pdf";
import { openPdfWithPassword } from "@/lib/pdf/pdf-security";

async function makeSource(): Promise<Uint8Array> {
  const doc = await CantoDoc.create();
  const font = await doc.embedFont("Helvetica");
  const page = doc.addPage([250, 350]);
  page.drawText("PROTECT-ME", { x: 20, y: 200, size: 16, font });
  doc.addPage([300, 400]);
  return doc.save();
}

function toFile(bytes: Uint8Array, name = "doc.pdf"): File {
  return new File([bytes.buffer as ArrayBuffer], name, { type: "application/pdf" });
}

async function makeEncrypted(): Promise<Uint8Array> {
  const doc = await CantoDoc.create();
  doc.addPage([200, 300]);
  doc.encrypt({ userPassword: "secret1", ownerPassword: "secret1", algorithm: "AES-256" });
  return doc.save();
}

describe("protectPdf", () => {
  it("produces a genuinely encrypted PDF that requires the password and matches page count", async () => {
    const source = await makeSource();
    const res = await protectPdf(
      { files: [{ name: "doc.pdf", file: toFile(source) }], options: { password: "hunter2!", confirmPassword: "hunter2!" } },
      new AbortController().signal,
      () => {},
    );

    expect(res.outputs).toHaveLength(1);
    expect(res.outputs[0].name).toBe("doc-protected.pdf");
    expect(res.outputs[0].blob.type).toBe("application/pdf");
    const summary = Object.fromEntries(res.summary?.map((s) => [s.label, s.value]) ?? []);
    expect(summary.Encryption).toBe("AES-256");
    expect(summary.Pages).toBe("2");

    // Independent check 1: pdf.js must refuse to open it without a password.
    const info = await inspectPdf(res.outputs[0].blob);
    expect(info.encrypted).toBe(true);

    // Independent check 2: pdf.js opens it with the right password, right pages.
    const pages = await openPdfWithPassword(res.outputs[0].blob, "hunter2!");
    expect(pages).toBe(2);

    // Independent check 3: @cantoo decrypts it with the password.
    const dec = await CantoDoc.load(new Uint8Array(await res.outputs[0].blob.arrayBuffer()), { password: "hunter2!" });
    expect(dec.isEncrypted).toBe(false);
    expect(dec.getPageCount()).toBe(2);
  });

  it("rejects a wrong password when opening the protected file", async () => {
    const source = await makeSource();
    const res = await protectPdf(
      { files: [{ name: "doc.pdf", file: toFile(source) }], options: { password: "hunter2!", confirmPassword: "hunter2!" } },
      new AbortController().signal,
      () => {},
    );
    await expect(openPdfWithPassword(res.outputs[0].blob, "nope")).rejects.toThrow(/incorrect/);
  });

  it("rejects a password that is too short", async () => {
    const source = await makeSource();
    await expect(
      protectPdf(
        { files: [{ name: "doc.pdf", file: toFile(source) }], options: { password: "abc", confirmPassword: "abc" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/at least 4 characters/);
  });

  it("rejects mismatched confirm passwords", async () => {
    const source = await makeSource();
    await expect(
      protectPdf(
        { files: [{ name: "doc.pdf", file: toFile(source) }], options: { password: "secret1", confirmPassword: "secret2" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/don't match/);
  });

  it("explains honestly when the input is already encrypted", async () => {
    const locked = await makeEncrypted();
    await expect(
      protectPdf(
        { files: [{ name: "locked.pdf", file: toFile(locked, "locked.pdf") }], options: { password: "secret1", confirmPassword: "secret1" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/already password-protected/);
  });

  it("gives a specific error for a corrupt input", async () => {
    const junk = new Uint8Array([37, 80, 68, 70, 45, 1, 2, 3, 4]);
    await expect(
      protectPdf(
        { files: [{ name: "broken.pdf", file: toFile(junk, "broken.pdf") }], options: { password: "secret1", confirmPassword: "secret1" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/could not be read|corrupted/);
  });
});