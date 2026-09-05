export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = "KB";
  for (const u of units) {
    if (value < 1024 || u === "GB") {
      unit = u;
      break;
    }
    value /= 1024;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${unit}`;
}

export function formatReduction(beforeBytes: number, afterBytes: number): string | null {
  if (beforeBytes <= 0) return null;
  const pct = (1 - afterBytes / beforeBytes) * 100;
  return pct >= 0.5 ? `${Math.round(pct)}%` : null;
}