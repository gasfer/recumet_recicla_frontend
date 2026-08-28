import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] || 'http://127.0.0.1:4200',
    channel: 'chrome',
    storageState: path.join(__dirname, 'e2e', '.auth', 'user.json'),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'review-320', use: { viewport: { width: 320, height: 720 } } },
    { name: 'review-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'review-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'review-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'review-1024', use: { viewport: { width: 1024, height: 900 } } },
    { name: 'review-1366', use: { viewport: { width: 1366, height: 900 } } },
  ],
});
