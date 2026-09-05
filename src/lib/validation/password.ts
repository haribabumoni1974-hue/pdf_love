/** Explicit password rules for Protect PDF — enforced in the UI and re-checked by the processor. */
export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 64;

/** Returns an actionable error message, or null when the password is acceptable. */
export function validateProtectPassword(password: string, confirm: string): string | null {
  if (!password) return "Enter a password to protect the PDF.";
  if (password !== password.trim()) {
    return "The password can't start or end with a space.";
  }
  if (password.length < PASSWORD_MIN) {
    return `The password must be at least ${PASSWORD_MIN} characters long.`;
  }
  if (password.length > PASSWORD_MAX) {
    return `The password must be no longer than ${PASSWORD_MAX} characters.`;
  }
  if (confirm !== password) {
    return "The passwords don't match. Re-enter the same password in both fields.";
  }
  return null;
}

/** Validate the password the unlock tool needs — must simply be present and sane. */
export function validateUnlockPassword(password: string): string | null {
  if (!password) return "Enter the password for this PDF to unlock it.";
  return null;
}