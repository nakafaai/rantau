import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ["*.ts", "!*.test.ts", "!vitest.config.ts"],
      provider: "istanbul",
      reporter: ["text", "json-summary"],
      thresholds: {
        100: true,
        perFile: true,
      },
    },
  },
});
