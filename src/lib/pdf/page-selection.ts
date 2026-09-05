import { ToolError } from "@/lib/processing/errors";

function parseToken(token: string, totalPages: number): number[] {
  const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token.trim());
  if (!m) {
    throw new ToolError(`"${token.trim()}" isn't a valid page or range. Use formats like 1, 1-3 or 5-8.`);
  }
  const a = Number(m[1]);
  const b = m[2] !== undefined ? Number(m[2]) : a;
  if (a > b) {
    throw new ToolError(`"${token.trim()}" is backwards — a range must start with a lower page number.`);
  }
  const out: number[] = [];
  for (let i = a; i <= b; i++) {
    if (i < 1 || i > totalPages) {
      throw new ToolError(
        `Page ${i} doesn't exist — this document has ${totalPages} page${totalPages === 1 ? "" : "s"}.`,
      );
    }
    out.push(i);
  }
  return out;
}

/**
 * Parse a spec like "1-3, 7, 10-12" into sorted, unique, 1-based page indices.
 * `loose` mode (used for ranges that may be non-contiguous order) keeps caller order.
 */
export function parsePageSpec(spec: string, totalPages: number): number[] {
  if (totalPages < 1) throw new ToolError("This document has no pages to select from.");
  const trimmed = spec.trim();
  if (!trimmed) {
    throw new ToolError("Enter the pages you want, e.g. 1-3, 7, 10-12.");
  }
  const tokens = trimmed.split(",");
  const seen = new Set<number>();
  const pages: number[] = [];
  for (const token of tokens) {
    for (const p of parseToken(token, totalPages)) {
      if (!seen.has(p)) {
        seen.add(p);
        pages.push(p);
      }
    }
  }
  if (pages.length === 0) throw new ToolError("No pages were selected.");
  return pages.sort((x, y) => x - y);
}

/** Parse a comma-separated order ("3, 1, 2, 4") that may omit pages (removed) but cannot repeat. */
export function parseOrderSpec(spec: string, totalPages: number): number[] {
  const trimmed = spec.trim();
  if (!trimmed) {
    throw new ToolError("Enter the new page order, e.g. 3, 1, 2, 4.");
  }
  const seen = new Set<number>();
  const order: number[] = [];
  for (const token of trimmed.split(",")) {
    const m = /^(\d+)$/.exec(token.trim());
    if (!m) throw new ToolError(`"${token.trim()}" isn't a page number.`);
    const p = Number(m[1]);
    if (p < 1 || p > totalPages) {
      throw new ToolError(`Page ${p} doesn't exist — this document has ${totalPages} pages.`);
    }
    if (seen.has(p)) throw new ToolError(`Page ${p} is listed more than once.`);
    seen.add(p);
    order.push(p);
  }
  return order;
}