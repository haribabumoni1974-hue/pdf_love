const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

/** Strip the extension and every character that is unsafe in a filename. */
export function sanitizeBaseName(name: string): string {
  const withoutExt = name.replace(/\.[^.]*$/, "");
  const cleaned = withoutExt
    .replace(INVALID_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  // Dots/spaces alone aren't a usable name (e.g. "...").
  return cleaned.replace(/[.\s]/g, "") ? cleaned : "document";
}

/** Sanitize a full filename while preserving its extension. */
export function sanitizeFileName(name: string): string {
  const ext = /(\.[^.]*)$/.exec(name)?.[1] ?? "";
  return `${sanitizeBaseName(name)}${ext}`;
}

export function fileExtension(name: string): string {
  const ext = /\.([^.]*)$/.exec(name)?.[1];
  return (ext ?? "").toLowerCase();
}

/** Merge output follows the tool's naming convention. */
export function mergedOutputName(): string {
  return "merged.pdf";
}

/** e.g. split-page-001.pdf, page-001.jpg — zero-padded, collision-free by index. */
export function numberedName(base: string, index: number, ext: string, pad = 3): string {
  const n = String(index).padStart(pad, "0");
  return `${sanitizeBaseName(base)}-${n}.${ext}`;
}