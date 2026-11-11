import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: process.env.ERP_BROWSER_CHANNEL || "chrome",
    headless: true,
    viewport: { width: 1512, height: 982 },
  },
  webServer: {
    command: process.env.ERP_TEST_PRODUCTION
      ? "npm run preview -- --port 4173 --strictPort"
      : "npm run dev:web -- --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
