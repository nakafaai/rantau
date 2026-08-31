import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  expect: { timeout: 10_000 },
  fullyParallel: true,
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec serve out -l ${port} --no-clipboard`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    url: `http://127.0.0.1:${port}/id/`,
  },
});
