module.exports = {
  ci: {
    collect: {
      // Start local server for Lighthouse testing
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      url: ['http://localhost:3000'],
      numberOfRuns: 3, // Run 3 times to get consistent results (SC-001)
      settings: {
        preset: 'desktop',
        throttling: {
          // Simulate typical desktop connection
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      // Fail CI if performance thresholds not met (SC-001: LCP < 5s)
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }], // 90+ performance score
        'largest-contentful-paint': ['error', { maxNumericValue: 5000 }], // LCP < 5s (SC-001)
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // FCP < 2s (warning only)
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }], // CLS < 0.1 (warning only)
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // TBT < 300ms (warning only)
      },
    },
    upload: {
      // Upload results to Lighthouse CI server (optional)
      target: 'temporary-public-storage',
      // If using Lighthouse CI server:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};
