import { describe, expect, it } from "vitest";
import { alternatePath, localePath } from "@/lib/locale";

describe("static locale paths", () => {
  it("targets exact Convex Static Hosting assets", () => {
    expect(localePath("en")).toBe("/en/index.html");
    expect(localePath("id")).toBe("/id/index.html");
  });

  it("switches between exact locale assets", () => {
    expect(alternatePath("en")).toBe("/id/index.html");
    expect(alternatePath("id")).toBe("/en/index.html");
  });
});
