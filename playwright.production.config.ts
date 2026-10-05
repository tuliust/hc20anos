import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PRODUCTION_BASE_URL ?? "https://www.hc20anos.com.br",
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
