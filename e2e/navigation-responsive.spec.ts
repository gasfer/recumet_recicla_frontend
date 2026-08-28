import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { assertNoGlobalOverflow, expectAuthenticatedPage, hasE2ECredentials } from './helpers/responsive';

const inventory = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'docs', 'quality', 'responsive-inventory.json'), 'utf8'),
) as { routes: string[] };

test.describe('registered navigation destinations', () => {
  for (const route of inventory.routes) {
    test(`${route} fits the viewport`, async ({ page }) => {
      test.skip(!hasE2ECredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated scenarios.');
      await page.goto(route);
      await expectAuthenticatedPage(page);
      await expect.poll(() => new URL(page.url()).pathname).toBe(route);
      const pageContent = page.locator('.page-content');
      await pageContent.waitFor({ state: 'visible' });
      await pageContent.getByRole('heading').first().waitFor({ state: 'visible' });
      await assertNoGlobalOverflow(page);
    });
  }
});
