import { describe, expect, it } from "@effect/vitest";
import {
  alternatePath,
  localizedPath,
  workspacePath,
  workspaceRoute,
} from "@/lib/locale";

describe("static locale paths", () => {
  it("creates clean route-owned workspace paths", () => {
    expect(workspacePath("en", "search")).toBe("/en/");
    expect(workspacePath("id", "profile")).toBe("/id/profile/");
    expect(workspacePath("en", "applications")).toBe("/en/applications/");
  });

  it("reads the workspace route from localized and root paths", () => {
    expect(workspaceRoute("/id/profile/")).toBe("profile");
    expect(workspaceRoute("/en/applications/")).toBe("applications");
    expect(workspaceRoute("/")).toBe("search");
  });

  it("preserves the route when switching language", () => {
    expect(alternatePath("en", "/en/profile/")).toBe("/id/profile/");
    expect(alternatePath("id", "/id/applications/")).toBe("/en/applications/");
    expect(localizedPath("id", "/en/")).toBe("/id/");
  });
});
