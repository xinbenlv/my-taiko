import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 800 },
    screenshot: 'off',
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: 'node server.js',
        port: 3000,
        reuseExistingServer: true,
      },
});
