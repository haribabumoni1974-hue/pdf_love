/** Error whose message is safe and helpful to show the user directly. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

export class AbortError extends Error {
  constructor() {
    super("The operation was cancelled.");
    this.name = "AbortError";
  }
}

export function isAbortError(err: unknown): boolean {
  return (
    err instanceof AbortError ||
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export function isToolError(err: unknown): err is ToolError {
  return err instanceof ToolError;
}

/** Convert an unknown failure into a human, actionable message. */
export function toActionableMessage(err: unknown): string {
  if (isAbortError(err)) return "The operation was cancelled.";
  if (isToolError(err)) return err.message;
  if (err instanceof Error) {
    if (err.message.includes("Encrypted PDF")) {
      return "This PDF is password-protected. Enter its password, or remove the password with the Unlock PDF tool first.";
    }
    return err.message || "The file could not be processed. It may be corrupted or use unsupported features.";
  }
  return "The file could not be processed. It may be corrupted or use unsupported features.";
}

export function actionableEncryptedMessage(name: string): string {
  return `"${name}" is password-protected. Enter the password, or use the Unlock PDF tool to remove it first.`;
}