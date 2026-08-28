import { defineConfig } from '@playwright/test';
import path from 'node:path';

const authFile = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./e2e/reporters/responsive-audit-reporter.ts'],
  ],
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200',
    channel: 'chrome',
    storageState: authFile,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'viewport-320', use: { viewport: { width: 320, height: 720 } } },
    { name: 'viewport-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'viewport-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'viewport-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'viewport-1024', use: { viewport: { width: 1024, height: 900 } } },
    { name: 'viewport-1366', use: { viewport: { width: 1366, height: 900 } } },
  ],
});
