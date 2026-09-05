import type { Processor } from "@/lib/types";

export type { ProcessInput, ProcessOptions, ProcessResult, Processor, ProgressCallback, ProgressUpdate } from "@/lib/types";

/** A processor module must export a default Processor. */
export interface ProcessorModule {
  default: Processor;
}