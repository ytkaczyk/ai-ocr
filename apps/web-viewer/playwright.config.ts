import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Limit to 4 workers for stability
  reporter: [['html', { outputFolder: 'playwright-report' }]],
  timeout: 60000, // Increase global test timeout to 60s for CI stability
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure', // Always keep trace for failed tests
    screenshot: 'only-on-failure', // Capture screenshot on failure
    video: 'retain-on-failure', // Keep video for failed tests
    actionTimeout: 15000, // Reduce action timeout to 15s (was 20s)
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Use production build for parallel tests to avoid Next.js dev server chunk loading issues
    // Dev server can't handle high concurrency from multiple workers (ChunkLoadError)
    command: process.env.USE_DEV_SERVER === 'true' ? 'npm run dev' : 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Give the server 2 minutes to start
  },
});
