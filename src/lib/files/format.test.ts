import { describe, expect, it } from "vitest";
import { formatBytes, formatReduction } from "./format";

describe("formatBytes", () => {
  it("formats small sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats KB/MB/GB", () => {
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10.0 MB");
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1.50 GB");
  });

  it("guards invalid input", () => {
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("formatReduction", () => {
  it("reports real reductions", () => {
    expect(formatReduction(100, 25)).toBe("75%");
    expect(formatReduction(1024 * 1024, 512 * 1024)).toBe("50%");
  });

  it("returns null for negligible reduction (honest compression)", () => {
    expect(formatReduction(100, 99.9)).toBeNull();
    expect(formatReduction(100, 150)).toBeNull();
  });
});