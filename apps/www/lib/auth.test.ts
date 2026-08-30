import { describe, expect, it } from "vitest";
import { authErrorKey } from "@/lib/auth";

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
});
