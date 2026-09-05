import { describe, expect, it, vi } from "vitest";
import { runTool } from "./run-tool";
import type { ToolConfig, ValidatedFile } from "@/lib/types";

// Minimal stand-in so the registry type is satisfied without rendering.
const IconPlaceholder = (() => null) as unknown as ToolConfig["icon"];

const validFile: ValidatedFile = {
  id: "1",
  name: "a.pdf",
  size: 100,
  file: new File([new Uint8Array(100)], "a.pdf", { type: "application/pdf" }),
  status: "valid",
  pageCount: 3,
};

const baseConfig: ToolConfig = {
  id: "merge",
  slug: "merge-pdf",
  title: "Merge PDF",
  shortDescription: "",
  metaDescription: "",
  longDescription: "",
  category: "pdf",
  icon: IconPlaceholder,
  keywords: [],
  capabilities: {
    localProcessing: true,
    multipleFiles: true,
    supportsPreview: false,
    supportsBatch: false,
    supportsCancellation: true,
    maxRecommendedSizeMB: 50,
    requiresPassword: false,
    acceptsEncrypted: false,
  },
  validationRules: {
    extensions: ["pdf"],
    mimeTypes: ["application/pdf"],
    minFiles: 2,
    maxFiles: 10,
    maxFileSizeMB: 50,
    maxPagesPerFile: 500,
    maxPagesTotal: 2000,
  },
  privacyMessage: "",
  faq: [],
  related: [],
  status: "ready",
};

describe("runTool", () => {
  it("loads the registered processor and streams progress", async () => {
    const processor = vi.fn(async (_input: unknown, _signal: AbortSignal, onProgress: (u: { message: string }) => void) => {
      onProgress({ message: "reading a.pdf" });
      return { outputs: [] };
    });
    const tool: ToolConfig = { ...baseConfig, loadProcessor: () => Promise.resolve({ default: processor as never }) };
    const updates: { message: string }[] = [];
    await runTool(tool, [validFile], {}, new AbortController().signal, (u) => updates.push(u));
    expect(processor).toHaveBeenCalledTimes(1);
    expect(updates.map((u) => u.message)).toEqual(["reading a.pdf"]);
  });

  it("explains when a tool has no processor yet", async () => {
    await expect(runTool(baseConfig, [validFile], {}, new AbortController().signal, () => {})).rejects.toThrow(
      "not available yet",
    );
  });
});