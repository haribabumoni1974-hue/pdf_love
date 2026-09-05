import type {
  ProcessInput,
  ProcessOptions,
  ProcessResult,
  ProgressCallback,
  ToolConfig,
  ValidatedFile,
} from "@/lib/types";

export type { ProcessInput, ProcessOptions, ProcessResult, ProgressCallback };

/**
 * Common processing abstraction. The UI never calls a processor directly:
 * it loads the tool's registered processor module and runs it with a shared
 * signal (cancellation) and progress callback (honest, measurable updates).
 * A future ServerProcessingProvider can slot in behind the same signature.
 */
export async function runTool(
  tool: ToolConfig,
  files: ValidatedFile[],
  options: ProcessOptions,
  signal: AbortSignal,
  onProgress: ProgressCallback,
): Promise<ProcessResult> {
  const loader = tool.loadProcessor;
  if (!loader) {
    throw new Error(`${tool.title} is not available yet in this build.`);
  }
  const input: ProcessInput = {
    files: files.map((f) => ({
      name: f.name,
      file: f.file,
      pageCount: f.pageCount,
    })),
    options,
  };
  const processorModule = await loader();
  return processorModule.default(input, signal, onProgress);
}

export function totalPagesOf(files: ValidatedFile[]): number {
  return files.reduce((sum, f) => sum + (f.pageCount ?? 0), 0);
}