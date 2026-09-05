import type { Processor } from "@/lib/types";
import { renderPdfToJpegs } from "@/lib/pdf/render-jpgs";

export const pdfToJpg: Processor = async ({ files, options }, signal, onProgress) => {
  const f = files[0];
  const level = typeof options.level === "string" ? options.level : "medium";
  const outputs = await renderPdfToJpegs(
    f.file,
    level,
    (current, total) => onProgress({ stage: "processing", message: `Rendering page ${current} of ${total}…`, current, total }),
    signal,
  );
  return {
    outputs,
    summary: [{ label: "Images", value: String(outputs.length) }],
    note: "Pages are rendered as JPEG images at your chosen quality — the output contains pictures of pages, not selectable text.",
  };
};

export default pdfToJpg;