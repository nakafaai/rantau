import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    coverage: {
      enabled: true,
      include: ["lib/auth.ts", "lib/locale.ts"],
      provider: "istanbul",
      reporter: ["text", "json-summary"],
      thresholds: {
        100: true,
        perFile: true,
      },
    },
  },
});
