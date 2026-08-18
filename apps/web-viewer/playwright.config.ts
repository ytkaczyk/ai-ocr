import { defineConfig, devices } from '@playwright/test';

// This devcontainer inherits DISPLAY=:0 from WSLg, but nothing answers on that
// socket. Chromium still starts and renders, yet its compositor never issues a
// BeginFrame, so requestAnimationFrame never fires. Playwright's actionability
// check waits for an element's box to stay put across two consecutive animation
// frames, so every click/hover/drag then hangs until actionTimeout while plain
// assertions and keyboard input keep passing - which reads as a broken app
// rather than a broken display. Clearing DISPLAY restores headless frame
// production (measured: 0 frames/600ms before, 49 after).
//
// Kept for headed and UI runs, which need a real display, and a no-op in CI
// where DISPLAY is not set at all.
const wantsRealDisplay = process.argv.some(
  (arg) => arg === '--headed' || arg === '--ui' || arg.startsWith('--ui-')
);

if (!wantsRealDisplay) {
  delete process.env.DISPLAY;
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4, // Cap local runs at 4 workers to avoid overwhelming the Next.js server and causing intermittent ChunkLoadError/timeouts
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
    command:
      process.env.USE_DEV_SERVER === 'true'
        ? 'npm run dev'
        : 'node -e "const fs = require(\'fs\'); if (fs.existsSync(\'.next\')) process.exit(0); process.exit(1);" && npm run start || (npm run build && npm run start)',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Give the server 2 minutes to start
  },
});
