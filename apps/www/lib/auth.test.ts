import { validateNewPassword } from "@convex-dev/auth/providers/password/validation";
import { describe, expect, it } from "@effect/vitest";
import { authErrorKey, authResultKey } from "@/lib/auth";

describe("auth error copy", () => {
  it("classifies invalid credentials from the immediate Convex cause", () => {
    const cause = new Error("InvalidAccountId");
    expect(authErrorKey(new Error("UnknownError", { cause }))).toBe("invalid");
  });

  it("classifies duplicate accounts", () => {
    expect(authErrorKey(new Error("Account already exists"))).toBe("exists");
  });

  it("classifies interrupted connections", () => {
    expect(
      authErrorKey(new Error("Connection lost while action was in flight"))
    ).toBe("connection");
  });

  it("keeps unknown failures generic", () => {
    expect(authErrorKey(new Error("Unexpected vendor failure"))).toBe("error");
  });

  it("normalizes non-error and non-error-cause failures", () => {
    expect(authErrorKey("offline")).toBe("error");
    expect(authErrorKey(new Error("Wrapper", { cause: "offline" }))).toBe(
      "error"
    );
  });

  it("recognizes every invalid credential signature", () => {
    expect(authErrorKey(new Error("Invalid credentials"))).toBe("invalid");
    expect(authErrorKey(new Error("InvalidSecret"))).toBe("invalid");
  });

  it("maps typed v2 failures without exposing provider details", () => {
    expect(authResultKey("EMAIL_TAKEN")).toBe("exists");
    expect(authResultKey("PASSWORD_TOO_COMMON")).toBe("common");
    expect(authResultKey("RATE_LIMITED")).toBe("rate");
    expect(authResultKey("INVALID_CREDENTIALS")).toBe("invalid");
    expect(authResultKey("INVALID_INPUT")).toBe("invalid");
    expect(authResultKey("USER_NOT_FOUND")).toBe("invalid");
  });

  it("uses the upstream v2 common-password policy", () => {
    expect(validateNewPassword("password1234")).toEqual({
      error: "PASSWORD_TOO_COMMON",
    });
    expect(validateNewPassword("violet orchard lantern river")).toBeNull();
  });
});
