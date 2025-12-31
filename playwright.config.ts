import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for Otterblade Odyssey
 *
 * Supports two modes:
 * 1. PLAYWRIGHT_MCP=true - Full Playwright MCP with headed browser and WebGL
 * 2. Default - Headless mode with WebGL workarounds for CI/limited environments
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const hasMcpSupport = process.env.PLAYWRIGHT_MCP === "true";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: hasMcpSupport ? 0 : isCI ? 2 : 0,
  workers: hasMcpSupport ? undefined : isCI ? 2 : undefined,
  timeout: hasMcpSupport ? 60000 : 30000,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: hasMcpSupport ? "http://localhost:5000" : "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: !hasMcpSupport,
    video: hasMcpSupport ? "on-first-retry" : "off",
    actionTimeout: 10000,
  },
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: hasMcpSupport
          ? {
              args: ["--enable-webgl", "--ignore-gpu-blocklist"],
            }
          : {
              args: [
                "--use-gl=swiftshader",
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--disable-gpu-sandbox",
              ],
            },
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        launchOptions: hasMcpSupport
          ? {
              args: ["--enable-webgl", "--ignore-gpu-blocklist"],
            }
          : {
              args: [
                "--use-gl=swiftshader",
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--disable-gpu-sandbox",
              ],
            },
      },
    },
  ],
  webServer: hasMcpSupport
    ? {
        command: "pnpm run dev",
        url: "http://localhost:5000",
        reuseExistingServer: false,
        timeout: 120000,
      }
    : {
        command: "pnpm build && pnpm preview",
        url: "http://localhost:4173",
        reuseExistingServer: !isCI,
        timeout: 120000,
      },
});
