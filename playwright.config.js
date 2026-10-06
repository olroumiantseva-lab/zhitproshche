const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-390', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'mobile-375', use: { ...devices['iPhone SE'], browserName: 'chromium' } }
  ],
  webServer: { command: 'node e2e/server.js', port: 4173, reuseExistingServer: true }
});
