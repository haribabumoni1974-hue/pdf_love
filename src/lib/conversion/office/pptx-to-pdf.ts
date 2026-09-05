import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { ToolError } from "@/lib/processing/errors";

/**
 * PPTX → PDF renderer (browser). Parses the OOXML package with JSZip and
 * draws each slide's shapes — backgrounds, rectangles, text boxes (with
 * per-run bold/italic/color/size) and images — onto a PDF page of the slide's
 * dimensions using pdf-lib. This produces real vector text (selectable),
 * not a screenshot. Grouped shapes, charts, tables and SmartArt are not
 * rendered; those cases are reported honestly as warnings.
 */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
});

const EMU_PER_PT = 12700;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: { r: number; g: number; b: number };
}

interface TextBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  runs: { text: string; size: number; bold: boolean; italic: boolean; color: { r: number; g: number; b: number } }[];
  align: "left" | "center" | "right";
  anchor: "ctr" | "b" | "t";
}

interface ImageBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  bytes: Uint8Array;
  relId: string;
}

interface SlideShapes {
  rects: Rect[];
  texts: TextBlock[];
  images: ImageBlock[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full || "000000", 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function numAttr(obj: unknown, key: string): number | undefined {
  if (obj && typeof obj === "object") {
    const v = (obj as Record<string, unknown>)[key];
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function colorOf(solidFill: unknown): { r: number; g: number; b: number } | undefined {
  const srgb = (solidFill as Record<string, unknown>)?.["a:srgbClr"];
  if (srgb && typeof srgb === "object") {
    const v = (srgb as Record<string, unknown>)["@_val"];
    if (typeof v === "string") return hexToRgb(v);
  }
  const scheme = (solidFill as Record<string, unknown>)?.["a:schemeClr"];
  if (scheme && typeof scheme === "object") {
    const v = (scheme as Record<string, unknown>)["@_val"];
    if (v === "tx1" || v === "bg1" && false) return { r: 0, g: 0, b: 0 };
    if (v === "bg1") return { r: 255, g: 255, b: 255 };
  }
  return undefined;
}

function parseTxfrm(node: unknown): { x: number; y: number; w: number; h: number } | null {
  const off = (node as Record<string, unknown>)?.["a:off"];
  const ext = (node as Record<string, unknown>)?.["a:ext"];
  const x = numAttr(off, "@_x");
  const y = numAttr(off, "@_y");
  const w = numAttr(ext, "@_cx");
  const h = numAttr(ext, "@_cy");
  if (x === undefined || y === undefined || w === undefined || h === undefined) return null;
  return { x: x / EMU_PER_PT, y: y / EMU_PER_PT, w: w / EMU_PER_PT, h: h / EMU_PER_PT };
}

interface ParsedRun {
  text: string;
  size: number;
  bold: boolean;
  italic: boolean;
  color: { r: number; g: number; b: number };
}

function parseRun(run: unknown, defaultSize: number): ParsedRun {
  const rPr = (run as Record<string, unknown>)?.["a:rPr"] ?? {};
  const rPrObj = rPr as Record<string, unknown>;
  const size = (numAttr(rPr, "@_sz") ?? defaultSize) / 100;
  const bold = rPrObj["@_b"] === true || rPrObj["@_b"] === 1 || rPrObj["@_b"] === "1";
  const italic = rPrObj["@_i"] === true || rPrObj["@_i"] === 1 || rPrObj["@_i"] === "1";
  const solidFill = (rPrObj["a:solidFill"] as Record<string, unknown>) ?? (run as Record<string, unknown>)["a:rPr"]?.["a:solidFill"];
  const color = colorOf(solidFill) ?? { r: 0, g: 0, b: 0 };
  const t = (run as Record<string, unknown>)?.["a:t"];
  const text = typeof t === "string" ? t : Array.isArray(t) ? t.map((x) => String(x)).join("") : "";
  return { text, size, bold, italic, color };
}

function parseParagraph(p: unknown, defaultSize: number): ParsedRun[] | null {
  const pPr = (p as Record<string, unknown>)?.["a:pPr"];
  const defRPr = (pPr as Record<string, unknown>)?.["a:defRPr"];
  const fallbackSize = numAttr(defRPr, "@_sz")
    ? (numAttr(defRPr, "@_sz") as number) / 100
    : defaultSize;
  const runs = asArray((p as Record<string, unknown>)?.["a:r"]).map((r) => parseRun(r, fallbackSize));
  // Break runs (<a:br/>) become newline.
  const breaks = asArray((p as Record<string, unknown>)?.["a:br"]).length;
  if (runs.length === 0 && breaks === 0 && !(p as Record<string, unknown>)?.["a:endParaRPr"]) return null;
  return runs;
}

function parseShape(node: unknown, onImage: (relId: string) => void): { rect?: Rect; text?: TextBlock; image?: ImageBlock } | null {
  const shape = node as Record<string, unknown>;
  const spPr = (shape["p:spPr"] ?? undefined) as Record<string, unknown> | undefined;
  const xfrmNode = spPr?.["a:xfrm"] ?? shape["a:xfrm"];
  const t = parseTxfrm(xfrmNode);
  if (!t) return null;

  // Fills: solidFill in spPr.
  const solidFill = spPr?.["a:solidFill"] ?? shape["a:solidFill"];
  const fill = colorOf(solidFill);

  // Pic: blipFill → a:blip → r:embed
  const blipFill = shape["p:blipFill"] as Record<string, unknown> | undefined;
  const embed = String((blipFill as Record<string, unknown>)?.["a:blip"]?.["@_r:embed"] ?? "");

  // Text body
  const txBody = shape["p:txBody"];
  if (txBody && typeof txBody === "object") {
    const bodyPr = (txBody as Record<string, unknown>)["a:bodyPr"] as Record<string, unknown> | undefined;
    const anchor = (bodyPr?.["@_anchor"] as string) ?? "t";
    const paras = asArray((txBody as Record<string, unknown>)["a:p"]);
    const runs: ParsedRun[] = [];
    for (const para of paras) {
      const parsed = parseParagraph(para, 18);
      if (parsed) runs.push(...parsed);
    }
    if (runs.length > 0) {
      const first = runs[0];
      const align = "left" as const;
      return {
        text: {
          x: t.x,
          y: t.y,
          w: t.w,
          h: t.h,
          runs,
          align,
          anchor: anchor as "ctr" | "b" | "t",
        },
      };
    }
  }

  // Image (pic) — stash the rel id; bytes are resolved by the caller.
  if (blipFill && embed) {
    const image: ImageBlock = { x: t.x, y: t.y, w: t.w, h: t.h, bytes: new Uint8Array(0), relId: embed };
    onImage(embed);
    return { image };
  }

  // Generic shape with fill → rectangle
  if (fill) {
    return { rect: { x: t.x, y: t.y, w: t.w, h: t.h, fill } };
  }
  return null;
}

function parseSlideShapes(spTree: unknown): { shapes: SlideShapes; skipped: string[] } {
  const tree = spTree as Record<string, unknown> | undefined;
  const rects: Rect[] = [];
  const texts: TextBlock[] = [];
  const images: ImageBlock[] = [];
  const skipped: string[] = [];
  const imageRelIds = new Set<string>();
  const sps = asArray(tree?.["p:sp"]);
  const pics = asArray(tree?.["p:pic"]);
  const graphicFrames = asArray(tree?.["p:graphicFrame"]);
  const grpSps = asArray(tree?.["p:grpSp"]);
  const consume = (node: unknown) => {
    const parsed = parseShape(node, (relId) => imageRelIds.add(relId));
    if (!parsed) return;
    if (parsed.text) texts.push(parsed.text);
    if (parsed.rect) rects.push(parsed.rect);
    if (parsed.image) images.push({ ...parsed.image, relId: parsed.image.relId });
  };
  sps.forEach(consume);
  pics.forEach(consume);
  if (graphicFrames.length > 0) skipped.push("charts/SmartArt");
  if (grpSps.length > 0) skipped.push("grouped shapes");
  if (!graphicFrames.length && !grpSps.length && imageRelIds.size === 0 && rects.length === 0 && texts.length === 0) {
    // Nothing structural found
  }
  return { shapes: { rects, texts, images }, skipped };
}

function drawTextBlock(page: PDFPage, block: TextBlock, fonts: { normal: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }) {
  const availableW = Math.max(10, block.w - 4);
  const lineHeight = 1.25;
  let cursorY = block.y + block.h; // start at top of box

  const fontSize = (run: ParsedRun) => Math.max(6, Math.min(72, run.size));
  // Flatten runs into a wrapped sequence.
  const lines: ParsedRun[][] = [];
  let current: ParsedRun[] = [];
  let currentW = 0;
  for (const run of block.runs) {
    const textParts = run.text.split("\n");
    for (let i = 0; i < textParts.length; i++) {
      const part = textParts[i];
      if (i > 0) {
        lines.push(current);
        current = [];
        currentW = 0;
      }
      if (part.length === 0) continue;
      const font = run.bold ? (run.italic ? fonts.boldItalic : fonts.bold) : run.italic ? fonts.italic : fonts.normal;
      const w = font.widthOfTextAtSize(part, fontSize(run));
      if (currentW + w > availableW && currentW > 0) {
        lines.push(current);
        current = [];
        currentW = 0;
      }
      current.push({ ...run, text: part });
      currentW += w;
    }
  }
  if (current.length > 0) lines.push(current);

  const totalHeight = lines.length * lineHeight;
  if (block.anchor === "ctr") cursorY = block.y + (block.h - totalHeight) / 2 + totalHeight;
  else if (block.anchor === "b") cursorY = block.y + Math.max(0, block.h - totalHeight) + totalHeight;

  for (const line of lines) {
    const widths = line.map((r) => {
      const font = r.bold ? (r.italic ? fonts.boldItalic : fonts.bold) : r.italic ? fonts.italic : fonts.normal;
      return font.widthOfTextAtSize(r.text, fontSize(r));
    });
    const lineW = widths.reduce((a, b) => a + b, 0);
    let x = block.x + 2;
    if (block.align === "center") x = block.x + (block.w - lineW) / 2;
    else if (block.align === "right") x = block.x + block.w - lineW - 2;
    for (let i = 0; i < line.length; i++) {
      const run = line[i];
      const font = run.bold ? (run.italic ? fonts.boldItalic : fonts.bold) : run.italic ? fonts.italic : fonts.normal;
      page.drawText(run.text, {
        x,
        y: cursorY - lineHeight,
        size: fontSize(run),
        font,
        color: rgb(run.color.r / 255, run.color.g / 255, run.color.b / 255),
      });
      x += widths[i];
    }
    cursorY -= lineHeight;
  }
}

export async function pptxToPdf(
  blob: Blob,
  opts: { onProgress: (m: string) => void },
): Promise<{ blob: Blob; warnings: string[]; summary: { label: string; value: string }[] }> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await blob.arrayBuffer());
  } catch (err) {
    throw new ToolError(`This file is not a valid PPTX package.${err instanceof Error ? ` (${err.message})` : ""}`);
  }

  const presentation = zip.file("ppt/presentation.xml");
  if (!presentation) throw new ToolError("This PPTX is missing its presentation part.");
  const presXml = await presentation.async("string");
  const pres = parser.parse(presXml);

  // Slide order from sldIdLst → rIds.
  const sldIdLst = pres?.["p:presentation"]?.["p:sldIdLst"];
  const sldIds = asArray(sldIdLst?.["p:sldId"]);
  const rIds: string[] = sldIds.map((s) => String((s as Record<string, unknown>)["@_r:id"] ?? "")).filter(Boolean);
  if (rIds.length === 0) throw new ToolError("This PPTX contains no slides.");

  // presentation rels → slide targets.
  const presRelsEntry = zip.file("ppt/_rels/presentation.xml.rels");
  const slideTargets = new Map<string, string>();
  if (presRelsEntry) {
    const relsXml = await presRelsEntry.async("string");
    const rels = parser.parse(relsXml);
    const relList = asArray((rels as Record<string, unknown>)?.["Relationships"]?.["Relationship"]);
    for (const rel of relList) {
      const r = rel as Record<string, unknown>;
      const id = r["@_Id"];
      const target = r["@_Target"];
      if (typeof id === "string" && typeof target === "string") {
        slideTargets.set(id, target.replace(/^\//, "").replace(/^\.\.\//, ""));
      }
    }
  }

  const warnings: string[] = [];
  const out = await PDFDocument.create();
  const fonts = {
    normal: await out.embedFont(StandardFonts.Helvetica),
    bold: await out.embedFont(StandardFonts.HelveticaBold),
    italic: await out.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await out.embedFont(StandardFonts.HelveticaBoldOblique),
  };

  const total = rIds.length;
  for (let i = 0; i < total; i++) {
    opts.onProgress(`Rendering slide ${i + 1} of ${total}…`);
    const relTarget = slideTargets.get(rIds[i]);
    const slidePath = relTarget ? `ppt/${relTarget}` : `ppt/slides/slide${i + 1}.xml`;
    const slideEntry = zip.file(slidePath);
    if (!slideEntry) {
      warnings.push(`Slide ${i + 1} could not be read and was rendered blank.`);
      continue;
    }
    const slideXml = await slideEntry.async("string");
    const slide = parser.parse(slideXml);
    const cSld = slide?.["p:sld"]?.["p:cSld"];

    // Background
    const bg = cSld?.["p:bg"];
    let bgColor = { r: 255, g: 255, b: 255 };
    const bgFill = (bg as Record<string, unknown>)?.["p:bgPr"]?.["a:solidFill"] ?? (bg as Record<string, unknown>)?.["p:bgRef"];
    const solidBg = colorOf(bgFill && (bgFill as Record<string, unknown>)["a:solidFill"] ? (bgFill as Record<string, unknown>)["a:solidFill"] : bgFill);
    if (solidBg) bgColor = solidBg;

    // Slide dimensions (EMU) from presentation (ignored here — use 16:9 default).
    const page = out.addPage([720, 540]); // 10"×7.5" default (4:3); overridden below if known
    // Try to read actual dims from presentation sldSz
    const sldSz = pres?.["p:presentation"]?.["p:sldSz"];
    const cx = numAttr(sldSz, "@_cx");
    const cy = numAttr(sldSz, "@_cy");
    if (cx && cy) {
      page.setSize(cx / EMU_PER_PT, cy / EMU_PER_PT);
    }
    page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: rgb(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255) });

    const { shapes, skipped } = parseSlideShapes(cSld?.["p:spTree"]);
    skipped.forEach((s) => warnings.push(`Slide ${i + 1}: ${s} are not rendered.`));

    for (const rect of shapes.rects) {
      // pdf-lib y is bottom-up: flip from top-left coords.
      const y = page.getHeight() - rect.y - rect.h;
      page.drawRectangle({ x: rect.x, y, width: rect.w, height: rect.h, color: rect.fill ? rgb(rect.fill.r / 255, rect.fill.g / 255, rect.fill.b / 255) : undefined, borderWidth: 0 });
    }
    for (const text of shapes.texts) {
      drawTextBlock(page, text, fonts);
    }
    for (const image of shapes.images) {
      // Resolve the rel id → media file bytes via the slide's rels part.
      const slideRelPath = `ppt/slides/_rels/slide${i + 1}.xml.rels`;
      let imgBytes: Uint8Array | null = null;
      const relEntry = zip.file(slideRelPath);
      if (relEntry && image.relId) {
        try {
          const relsXml = await relEntry.async("string");
          const rels = parser.parse(relsXml);
          const relList = asArray((rels as Record<string, unknown>)?.["Relationships"]?.["Relationship"]);
          for (const rel of relList) {
            const r = rel as Record<string, unknown>;
            if (String(r["@_Id"]) !== image.relId) continue;
            const target = String(r["@_Target"] ?? "").replace(/^\/\.\.\//, "").replace(/^\//, "").replace(/^\.\.\//, "");
            const media = zip.file(target.startsWith("ppt/") ? target : `ppt/${target}`);
            if (media) imgBytes = new Uint8Array(await media.async("arraybuffer"));
          }
        } catch {
          /* fall through */
        }
      }
      if (imgBytes && image.w > 0 && image.h > 0) {
        try {
          let img;
          try {
            img = await out.embedJpg(imgBytes);
          } catch {
            img = await out.embedPng(imgBytes);
          }
          const y = page.getHeight() - image.y - image.h;
          page.drawImage(img, { x: image.x, y, width: image.w, height: image.h });
        } catch {
          warnings.push(`Slide ${i + 1}: an image could not be rendered.`);
        }
      } else {
        warnings.push(`Slide ${i + 1}: an image could not be read and was skipped.`);
      }
    }
  }

  const bytes = await out.save();
  const pdfBlob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  if (warnings.length === 0 && total === 0) {
    throw new ToolError("The slide deck could not be rendered.");
  }
  return {
    blob: pdfBlob,
    summary: [{ label: "Slides", value: String(total) }],
    warnings: [
      "Slides are rendered as vector PDF pages: text stays selectable, shapes and images are drawn. Charts, SmartArt and grouped elements are not reconstructed.",
      ...warnings.slice(0, 6),
    ],
  };
}