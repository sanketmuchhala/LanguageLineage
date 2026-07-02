import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4445',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx serve public -p 4445 -s',
    url: 'http://localhost:4445',
    reuseExistingServer: true,
  },
});
