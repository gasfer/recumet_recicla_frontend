import { chromium, FullConfig } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export default async function globalSetup(config: FullConfig) {
  const authDirectory = path.join(__dirname, '.auth');
  const authFile = path.join(authDirectory, 'user.json');
  await mkdir(authDirectory, { recursive: true });

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    await writeFile(authFile, JSON.stringify({ cookies: [], origins: [] }));
    console.warn('E2E_EMAIL/E2E_PASSWORD are not set; authenticated scenarios will be skipped.');
    return;
  }

  const baseURL = String(config.projects[0].use.baseURL ?? 'http://127.0.0.1:4200');
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto(`${baseURL}/auth/login`);
  await page.locator('#email').fill(email);
  await page.locator('input[formControlName="password"]').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();

  const contextDialog = page.locator('.p-dialog');
  await contextDialog.waitFor({ state: 'visible' });
  await contextDialog.getByRole('button', { name: 'Continuar' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'));
  await page.context().storageState({ path: authFile });
  await browser.close();
}
