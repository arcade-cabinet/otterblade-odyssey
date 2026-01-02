import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for Otterblade Odyssey
 *
 * Auto-detects environment and configures appropriately:
 * - Copilot MCP: Reuses existing server if available (seamless)
 * - Local dev: Starts dev server automatically
 * - CI: Builds and previews production bundle with video capture
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const isCI = !!process.env.CI;
const isMCP = !!process.env.PLAYWRIGHT_MCP;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: !isMCP, // Sequential in MCP for debugging
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : isMCP ? 1 : undefined,
  timeout: 60000, // Generous timeout for WebGL games

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(isCI ? [['github' as const]] : []),
  ],

  use: {
    baseURL: 'http://localhost:5173', // Single consistent port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'on' : isMCP ? 'retain-on-failure' : 'off',
    actionTimeout: 15000,

    // Headless mode control
    headless: !isMCP,

    // WebGL support for all environments
    launchOptions: {
      args: [
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--use-gl=swiftshader', // Software rendering fallback
        '--disable-gpu-sandbox',
      ],
    },
  },

  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Smart server management - always reuses existing, starts if needed
  webServer: {
    command: 'pnpm run dev:client',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // KEY: Always reuse for MCP seamlessness
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
