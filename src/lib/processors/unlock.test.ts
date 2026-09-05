import { describe, expect, it, vi } from "vitest";
import { PDFDocument as CantoDoc } from "@cantoo/pdf-lib";
import { getDocument } from "pdfjs-dist";
import { unlockPdf } from "./unlock";
import { classifyDecryptFailure } from "@/lib/pdf/pdf-security";
import { inspectPdf } from "@/lib/pdf/parse-pdf";
import * as security from "@/lib/pdf/pdf-security";

async function makePlain(): Promise<Uint8Array> {
  const doc = await CantoDoc.create();
  const font = await doc.embedFont("Helvetica");
  const page = doc.addPage([250, 350]);
  page.drawText("UNLOCK-ME-NOW", { x: 20, y: 200, size: 16, font });
  return doc.save();
}

async function makeEncrypted(): Promise<Uint8Array> {
  const plain = await makePlain();
  const doc = await CantoDoc.load(plain, {});
  doc.encrypt({ userPassword: "secret1", ownerPassword: "secret1", algorithm: "AES-256" });
  return doc.save();
}

function toFile(bytes: Uint8Array, name = "locked.pdf"): File {
  return new File([bytes.buffer as ArrayBuffer], name, { type: "application/pdf" });
}

async function textOf(blob: Blob): Promise<string> {
  const data = new Uint8Array(await blob.arrayBuffer());
  const task = getDocument({ data, useWorkerFetch: false, disableAutoFetch: true });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const text = content.items.map((i) => ("str" in i ? (i as { str: string }).str : "")).join("|");
  await task.destroy();
  return text;
}

describe("unlockPdf", () => {
  it("detects encrypted input and produces a genuinely unencrypted readable PDF", async () => {
    const locked = await makeEncrypted();
    // Input must be detected as encrypted before we even try to unlock it.
    expect((await inspectPdf(toFile(locked))).encrypted).toBe(true);

    const res = await unlockPdf(
      { files: [{ name: "locked.pdf", file: toFile(locked) }], options: { password: "secret1" } },
      new AbortController().signal,
      () => {},
    );

    expect(res.outputs).toHaveLength(1);
    expect(res.outputs[0].name).toBe("locked-unlocked.pdf");
    const summary = Object.fromEntries(res.summary?.map((s) => [s.label, s.value]) ?? []);
    expect(summary.Encryption).toBe("Removed");
    expect(summary.Pages).toBe("1");

    const blob = res.outputs[0].blob;
    // Must be readable WITHOUT any password.
    expect((await inspectPdf(blob)).encrypted).toBe(false);
    const viaCantoo = await CantoDoc.load(new Uint8Array(await blob.arrayBuffer()), {});
    expect(viaCantoo.isEncrypted).toBe(false);
    // And the content survived — text is still real text, not a rasterised image.
    expect(await textOf(blob)).toContain("UNLOCK-ME-NOW");
  });

  it("rejects a wrong password with a clear message", async () => {
    const locked = await makeEncrypted();
    await expect(
      unlockPdf(
        { files: [{ name: "locked.pdf", file: toFile(locked) }], options: { password: "wrong" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/incorrect/);
  });

  it("explains that a non-encrypted PDF has nothing to unlock", async () => {
    const plain = await makePlain();
    await expect(
      unlockPdf(
        { files: [{ name: "plain.pdf", file: toFile(plain, "plain.pdf") }], options: { password: "secret1" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/not password-protected/);
  });

  it("asks for a password before attempting decryption", async () => {
    const locked = await makeEncrypted();
    await expect(
      unlockPdf({ files: [{ name: "locked.pdf", file: toFile(locked) }], options: { password: "" } }, new AbortController().signal, () => {}),
    ).rejects.toThrow(/Enter the password/);
  });

  it("reports unsupported encryption methods honestly", async () => {
    const locked = await makeEncrypted();
    const spy = vi.spyOn(security, "decryptPdfAndRebuild").mockRejectedValue(new Error("unknown encryption method"));
    await expect(
      unlockPdf(
        { files: [{ name: "locked.pdf", file: toFile(locked) }], options: { password: "secret1" } },
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toThrow(/cannot currently decrypt in the browser/);
    spy.mockRestore();
  });
});

describe("classifyDecryptFailure", () => {
  it("maps wrong passwords, unsupported methods and unknown failures to precise messages", () => {
    expect(classifyDecryptFailure(new Error("Password incorrect")).message).toMatch(/incorrect for this PDF/);
    expect(classifyDecryptFailure(new Error("unknown encryption method")).message).toMatch(/cannot currently decrypt in the browser/);
    expect(classifyDecryptFailure(new Error("unsupported encryption algorithm")).message).toMatch(/cannot currently decrypt in the browser/);
    expect(classifyDecryptFailure(new Error("something else went wrong")).message).toMatch(/could not be decrypted/);
  });
});