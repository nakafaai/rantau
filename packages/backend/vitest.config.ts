import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ["convex/cv.ts", "convex/profiles.ts", "convex/searches.ts"],
      provider: "istanbul",
      reporter: ["text", "json-summary"],
      thresholds: {
        100: true,
        perFile: true,
      },
    },
    environment: "edge-runtime",
  },
});
