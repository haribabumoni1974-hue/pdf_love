import { describe, expect, it } from "vitest";
import { validateProtectPassword, validateUnlockPassword, PASSWORD_MAX, PASSWORD_MIN } from "./password";

describe("validateProtectPassword", () => {
  it("accepts a reasonable password with a matching confirmation", () => {
    expect(validateProtectPassword("hunter2!", "hunter2!")).toBeNull();
  });

  it("requires a password", () => {
    expect(validateProtectPassword("", "")).toMatch(/Enter a password/);
  });

  it("enforces the minimum length", () => {
    expect(validateProtectPassword("a".repeat(PASSWORD_MIN - 1), "a".repeat(PASSWORD_MIN - 1))).toMatch(/at least 4 characters/);
    expect(validateProtectPassword("a".repeat(PASSWORD_MIN), "a".repeat(PASSWORD_MIN))).toBeNull();
  });

  it("enforces the maximum length", () => {
    const tooLong = "x".repeat(PASSWORD_MAX + 1);
    expect(validateProtectPassword(tooLong, tooLong)).toMatch(/no longer than/);
    expect(validateProtectPassword("x".repeat(PASSWORD_MAX), "x".repeat(PASSWORD_MAX))).toBeNull();
  });

  it("rejects leading or trailing spaces", () => {
    expect(validateProtectPassword(" secret ", " secret ")).toMatch(/can't start or end with a space/);
  });

  it("rejects mismatched confirmations", () => {
    expect(validateProtectPassword("abcde", "abcdf")).toMatch(/don't match/);
  });
});

describe("validateUnlockPassword", () => {
  it("requires a non-empty password", () => {
    expect(validateUnlockPassword("")).toMatch(/Enter the password/);
    expect(validateUnlockPassword("secret1")).toBeNull();
  });
});