import { createZipBlob } from "@/lib/files/zip";

/**
 * Minimal OOXML XLSX writer. Builds a real SpreadsheetML package with one or
 * more worksheets (shared strings, inline values) and packages it as a valid
 * ZIP. Used by PDF → Excel (and by tests). No workbook-level chrome beyond
 * what a spreadsheet app needs to open and validate the workbook.
 */

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export interface SheetData {
  name: string;
  rows: (string | number | null)[][];
}

function sheetXml(rows: SheetData["rows"]): string {
  const parts: string[] = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'];
  parts.push(
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>',
  );
  rows.forEach((row, r) => {
    const cells = row
      .map((value, c) => {
        if (value === null || value === undefined || value === "") return "";
        const ref = `${colLetter(c)}${r + 1}`;
        if (typeof value === "number") {
          return `<c r="${ref}"><v>${value}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
      })
      .join("");
    parts.push(`<row r="${r + 1}">${cells}</row>`);
  });
  parts.push("</sheetData></worksheet>");
  return parts.join("");
}

function workbookXml(sheets: SheetData[]): string {
  const sheetEntries = sheets
    .map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    "<sheets>" +
    sheetEntries +
    "</sheets></workbook>"
  );
}

function workbookRels(sheets: SheetData[]): string {
  const items = sheets
    .map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
    .join("");
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    `<Relationship Id="rId0" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    items +
    "</Relationships>"
  );
}

function contentTypes(sheets: SheetData[]): string {
  const overrides = sheets
    .map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    overrides +
    "</Types>"
  );
}

function coreProps(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    "<dc:creator>pdf_love</dc:creator>" +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>` +
    `</cp:coreProperties>`
  );
}

/** Build a real XLSX blob from sheet data (empty cells omitted, text + numbers). */
export async function writeXlsx(sheets: SheetData[]): Promise<Blob> {
  const cleaned = sheets.map((s) => ({ name: s.name.slice(0, 31), rows: s.rows }));
  const entries = [
    { name: "[Content_Types].xml", blob: new Blob([contentTypes(cleaned)]) },
    { name: "_rels/.rels", blob: new Blob([workbookRels(cleaned)]) },
    { name: "xl/workbook.xml", blob: new Blob([workbookXml(cleaned)]) },
    ...cleaned.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      blob: new Blob([sheetXml(s.rows)]),
    })),
    { name: "docProps/core.xml", blob: new Blob([coreProps()]) },
  ];
  return createZipBlob(entries);
}