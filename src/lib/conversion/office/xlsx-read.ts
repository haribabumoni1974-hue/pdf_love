import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { ToolError } from "@/lib/processing/errors";

/**
 * Minimal XLSX reader (no heavy dependency): unzips the workbook with JSZip,
 * parses the worksheet XML, dereferences shared strings, and returns cell
 * grids per sheet. Used by Excel → PDF to render the spreadsheet.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: false,
  isArray: (name) => name === "row" || name === "c" || name === "sheet",
});

export interface SheetGrid {
  name: string;
  rows: (string | number | null)[][];
}

interface CellRef {
  row: number; // 0-based
  col: number; // 0-based
}

function refToIndex(ref: string): CellRef {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return { row: 0, col: 0 };
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { row: Number(m[2]) - 1, col: col - 1 };
}

function columnIndexToName(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export interface ParsedWorkbook {
  sheets: SheetGrid[];
}

export async function readXlsx(blob: Blob): Promise<ParsedWorkbook> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await blob.arrayBuffer());
  } catch (err) {
    throw new ToolError(
      `This file is not a valid XLSX package.${err instanceof Error ? ` (${err.message})` : ""}`,
    );
  }

  const workbookEntry = zip.file("xl/workbook.xml");
  if (!workbookEntry) throw new ToolError("This XLSX is missing its workbook part (xl/workbook.xml).");
  const workbookXml = await workbookEntry.async("string");
  const wb = parser.parse(workbookXml);
  const sheetNodes = wb?.workbook?.sheets?.sheet ?? [];
  const sheetNames: string[] = (Array.isArray(sheetNodes) ? sheetNodes : [sheetNodes])
    .map((s) => s?.["@_name"] ?? "Sheet")
    .filter(Boolean);

  // shared strings
  const sharedStrings: string[] = [];
  const ssEntry = zip.file("xl/sharedStrings.xml");
  if (ssEntry) {
    const ssXml = await ssEntry.async("string");
    const ss = parser.parse(ssXml);
    const items = ss?.sst?.si ?? [];
    const arr = Array.isArray(items) ? items : [items];
    for (const item of arr) {
      if (typeof item === "string") {
        sharedStrings.push(item);
      } else if (item && typeof item.t === "string") {
        sharedStrings.push(item.t);
      } else if (item && typeof item.t === "object") {
        // <t> may be nested under preserve space; fast-xml-parser returns string or object
        sharedStrings.push(String((item.t as Record<string, unknown>)["#text"] ?? ""));
      } else if (item && Array.isArray(item.r)) {
        sharedStrings.push(String(item.r.map((r: unknown) => (r as { t?: unknown })?.t ?? "").join("")));
      } else {
        sharedStrings.push("");
      }
    }
  }

  const sheets: SheetGrid[] = [];
  for (let i = 0; i < sheetNames.length; i++) {
    const entry = zip.file(`xl/worksheets/sheet${i + 1}.xml`);
    if (!entry) {
      sheets.push({ name: sheetNames[i], rows: [] });
      continue;
    }
    const xml = await entry.async("string");
    const parsed = parser.parse(xml);
    const rows = parsed?.worksheet?.sheetData?.row ?? [];
    const rowArr = Array.isArray(rows) ? rows : [rows];
    const grid: (string | number | null)[][] = [];
    let maxCol = -1;
    const cellsByKey = new Map<string, string | number>();
    for (const row of rowArr) {
      const cells = row?.c ?? [];
      const cellArr = Array.isArray(cells) ? cells : [cells];
      for (const cell of cellArr) {
        if (!cell || !cell["@_r"]) continue;
        const { row: r, col: c } = refToIndex(cell["@_r"]);
        const type = cell["@_t"];
        let value: string | number | null = null;
        if (type === "s") {
          const idx = Number(cell?.v);
          value = sharedStrings[Number.isFinite(idx) ? idx : 0] ?? "";
        } else if (cell && cell.v !== undefined) {
          const raw = String(cell.v);
          const num = Number(raw);
          value = Number.isFinite(num) && raw.trim() !== "" ? num : raw;
        } else if (cell && cell.is && cell.is.t !== undefined) {
          value = typeof cell.is.t === "string" ? cell.is.t : String((cell.is.t as Record<string, unknown>)["#text"] ?? "");
        }
        cellsByKey.set(`${r}:${c}`, value ?? "");
        if (c > maxCol) maxCol = c;
      }
    }
    // Assemble full grid from keyed cells (rows up to the max row referenced).
    let maxRow = -1;
    for (const key of cellsByKey.keys()) {
      const r = Number(key.split(":")[0]);
      if (r > maxRow) maxRow = r;
    }
    for (let r = 0; r <= maxRow; r++) {
      const row: (string | number | null)[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const v = cellsByKey.get(`${r}:${c}`);
        row.push(v === undefined ? null : v === "" ? null : v);
      }
      grid.push(row);
    }
    sheets.push({ name: sheetNames[i], rows: grid });
  }
  return { sheets };
}

export { columnIndexToName };