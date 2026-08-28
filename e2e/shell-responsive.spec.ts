import { expect, Locator, test } from '@playwright/test';
import { assertNoGlobalOverflow, expectAuthenticatedPage, hasE2ECredentials } from './helpers/responsive';

async function selectedDropdownValue(dropdown: Locator): Promise<string> {
  const selectedValue = dropdown.locator('.p-dropdown-label:not(.p-placeholder)');
  await expect(selectedValue).toBeVisible();
  await expect.poll(async () => (await selectedValue.innerText()).trim()).toMatch(/\S/);
  return (await selectedValue.innerText()).trim();
}

test.describe('responsive authenticated shell', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated scenarios.');
    await page.goto('/dashboard/home');
    await expectAuthenticatedPage(page);
  });

  test('sidebar and topbar remain operable', async ({ page }) => {
    const viewport = page.viewportSize()!;
    const menuButton = page.locator('#vertical-menu-btn');
    const selectedBranch = page.locator('#topbar-sucursal').locator('xpath=..');
    const selectedStorage = page.locator('#topbar-storage').locator('xpath=..');
    await expect(selectedBranch).toBeVisible();
    await expect(selectedStorage).toBeVisible();

    if (viewport.width <= 992) {
      await menuButton.click();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.app-sidebar-backdrop')).toHaveClass(/is-visible/);
      await page.keyboard.press('Escape');
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      await expect(menuButton).toBeFocused();
    } else {
      await expect(page.locator('.vertical-menu')).toBeVisible();
    }

    await assertNoGlobalOverflow(page);
  });

  test('orientation-like resize preserves work context', async ({ page }) => {
    const branch = page.locator('p-dropdown').filter({ has: page.locator('#topbar-sucursal') });
    const storage = page.locator('p-dropdown').filter({ has: page.locator('#topbar-storage') });
    const branchText = await selectedDropdownValue(branch);
    const storageText = await selectedDropdownValue(storage);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await expect(branch.locator('.p-dropdown-label:not(.p-placeholder)')).toHaveText(branchText);
    await expect(storage.locator('.p-dropdown-label:not(.p-placeholder)')).toHaveText(storageText);
    await assertNoGlobalOverflow(page);
  });

  test('keyboard operation preserves visible focus and mobile menu state', async ({ page }) => {
    const viewport = page.viewportSize()!;
    const menuButton = page.locator('#vertical-menu-btn');
    await menuButton.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(menuButton).toBeFocused();

    const focusStyle = await menuButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    expect(
      focusStyle.outlineStyle !== 'none' && focusStyle.outlineWidth !== '0px'
        || focusStyle.boxShadow !== 'none',
    ).toBe(true);

    if (viewport.width <= 992) {
      await page.keyboard.press('Enter');
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      const sidebar = page.locator('#app-sidebar');
      await expect.poll(() => sidebar.evaluate((element) => element.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(menuButton).toBeFocused();
      await expect(sidebar).toHaveAttribute('inert', '');

      await page.keyboard.press('Space');
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      await page.locator('.app-sidebar-backdrop').click({ position: { x: viewport.width - 2, y: 2 } });
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      await expect(menuButton).toBeFocused();
    }

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).not.toHaveCount(0);
    await page.keyboard.press('Shift+Tab');
    await expect(menuButton).toBeFocused();
  });
});
