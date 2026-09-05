/**
 * Minimal, dependency-free ZIP writer for bundling multiple outputs
 * (e.g. split parts, PDF→JPG images) into one downloadable archive.
 * Entries are stored uncompressed — PDFs and JPGs are already compressed, so
 * this keeps the format simple and standard (PKZIP, method 0) while still
 * producing a real, extractable ZIP.
 */

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
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const textEncoder = new TextEncoder();

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

interface PendingEntry {
  name: Uint8Array;
  data: Uint8Array;
  crc: number;
  offset: number;
}

/** Build a valid ZIP archive (stored entries) from named blobs. */
export async function createZipBlob(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  const pending: PendingEntry[] = [];
  let centralSize = 0;
  let offset = 0;
  const chunks: BlobPart[] = [];

  for (const entry of entries) {
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const name = textEncoder.encode(entry.name);
    const crc = crc32(data);
    // General purpose bit 11 set → names are UTF-8.
    const flags = 0x0800;
    // Local file header
    const local = new Uint8Array(30 + name.length);
    local.set(u32(0x04034b50), 0); // signature
    local.set(u16(20), 4); // version needed
    local.set(u16(flags), 6); // flags
    local.set(u16(0), 8); // method: store
    local.set(u16(0), 10); // mod time
    local.set(u16(0), 12); // mod date
    local.set(u32(crc), 14);
    local.set(u32(data.length), 18); // compressed size
    local.set(u32(data.length), 22); // uncompressed size
    local.set(u16(name.length), 26);
    local.set(u16(0), 28); // extra length
    local.set(name, 30);
    chunks.push(local, data);
    pending.push({ name, data, crc, offset });
    offset += 30 + name.length + data.length;
    centralSize += 46 + name.length;
  }

  const centralOffset = offset;
  for (const entry of pending) {
    const cd = new Uint8Array(46 + entry.name.length);
    cd.set(u32(0x02014b50), 0); // central signature
    cd.set(u16(20), 4); // version made by
    cd.set(u16(20), 6); // version needed
    cd.set(u16(0x0800), 8); // flags
    cd.set(u16(0), 10); // method: store
    cd.set(u16(0), 12); // mod time
    cd.set(u16(0), 14); // mod date
    cd.set(u32(entry.crc), 16);
    cd.set(u32(entry.data.length), 20);
    cd.set(u32(entry.data.length), 24);
    cd.set(u16(entry.name.length), 28);
    cd.set(u16(0), 30); // extra
    cd.set(u16(0), 32); // comment
    cd.set(u16(0), 34); // disk number
    cd.set(u16(0), 36); // internal attrs
    cd.set(u32(0), 38); // external attrs
    cd.set(u32(entry.offset), 42);
    cd.set(entry.name, 46);
    chunks.push(cd);
  }

  const count = pending.length;
  const end = new Uint8Array(22);
  end.set(u32(0x06054b50), 0); // EOCD signature
  end.set(u16(0), 4); // disk number
  end.set(u16(0), 6); // cd start disk
  end.set(u16(count), 8); // entries on this disk
  end.set(u16(count), 10); // total entries
  end.set(u32(centralSize), 12); // cd size
  end.set(u32(centralOffset), 16); // cd offset
  end.set(u16(0), 20); // comment length
  chunks.push(end);

  return new Blob(chunks, { type: "application/zip" });
}