import { describe, expect, it } from "vitest";
import { createZipBlob } from "./zip";

// Tiny independent CRC32 for cross-checking stored payloads in the test.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve) => {
    blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
  });
}

describe("createZipBlob", () => {
  it("produces a valid ZIP with every entry stored intact", async () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new TextEncoder().encode("hello zip");
    const blob = await createZipBlob([
      { name: "a.bin", blob: new Blob([a]) },
      { name: "b.txt", blob: new Blob([b]) },
    ]);

    const bytes = await bytesOf(blob);
    expect(bytes.length).toBeGreaterThan(0);
    // Local file header of the first entry.
    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe("PK\x03\x04");
    // EOCD is the final record.
    const eocd = bytes.subarray(bytes.length - 22);
    expect(String.fromCharCode(...eocd.subarray(0, 4))).toBe("PK\x05\x06");
    const count = eocd[10] | (eocd[11] << 8);
    expect(count).toBe(2);

    // Walk the two stored entries and verify names + payloads + CRCs.
    let pos = 0;
    const seen: { name: string; crc: number }[] = [];
    for (let i = 0; i < count; i++) {
      const sig = String.fromCharCode(...bytes.subarray(pos, pos + 4));
      expect(sig).toBe("PK\x03\x04");
      const nameLen = bytes[pos + 26] | (bytes[pos + 27] << 8);
      const extraLen = bytes[pos + 28] | (bytes[pos + 29] << 8);
      const crc = (bytes[pos + 14] |
        (bytes[pos + 15] << 8) |
        (bytes[pos + 16] << 16) |
        (bytes[pos + 17] << 24)) >>>
        0;
      const size = (bytes[pos + 18] | (bytes[pos + 19] << 8) | (bytes[pos + 20] << 16) | (bytes[pos + 21] << 24)) >>> 0;
      const name = new TextDecoder().decode(bytes.subarray(pos + 30, pos + 30 + nameLen));
      const data = bytes.subarray(pos + 30 + nameLen + extraLen, pos + 30 + nameLen + extraLen + size);
      expect(crc32(data)).toBe(crc);
      seen.push({ name, crc });
      pos += 30 + nameLen + extraLen + size;
    }
    expect(seen.map((s) => s.name)).toEqual(["a.bin", "b.txt"]);
    // Central directory + EOCD follow the last local entry.
    const centralSig = String.fromCharCode(...bytes.subarray(pos, pos + 4));
    expect(centralSig).toBe("PK\x01\x02");
  });

  it("handles a single entry and non-ASCII names", async () => {
    const blob = await createZipBlob([{ name: "café.pdf", blob: new Blob([new Uint8Array([9, 9])]) }]);
    const bytes = await bytesOf(blob);
    const nameLen = bytes[26] | (bytes[27] << 8);
    const name = new TextDecoder().decode(bytes.subarray(30, 30 + nameLen));
    expect(name).toBe("café.pdf");
  });
});