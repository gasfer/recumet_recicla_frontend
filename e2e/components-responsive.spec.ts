import { expect, Locator, Page, test } from '@playwright/test';
import { assertNoGlobalOverflow, expectAuthenticatedPage, hasE2ECredentials } from './helpers/responsive';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].map((selector) => [
  `${selector}:visible`,
  ':not([tabindex="-1"])',
  ':not([data-p-hidden-focusable="true"])',
  ':not([data-p-hidden-accessible="true"])',
  ':not(.p-hidden-focusable)',
  ':not(.p-hidden-accessible)',
  ':not([role="presentation"])',
  ':not([aria-hidden="true"])',
  ':not([aria-hidden="true"] *)',
  ':not([inert])',
  ':not([inert] *)',
].join('')).join(', ');

async function expectInsideViewport(page: Page, element: Locator) {
  await expect.poll(async () => {
    const box = await element.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !viewport) return false;
    return box.x >= -1
      && box.y >= -1
      && box.x + box.width <= viewport.width + 1
      && box.y + box.height <= viewport.height + 1;
  }).toBe(true);
}

async function expectFocusInside(element: Locator) {
  await expect.poll(() => element.evaluate((container) => container.contains(document.activeElement))).toBe(true);
}

async function visibleRowSignatures(table: Locator): Promise<string[]> {
  return table.locator('tbody > tr:visible').evaluateAll((rows) => rows
    .filter((row) => row.querySelectorAll('td').length > 0)
    .map((row) => [...row.querySelectorAll('td')]
      .map((cell) => {
        const clone = cell.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('.p-column-title').forEach((label) => label.remove());
        return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
      })
      .join('|')));
}

async function expectRowsToChange(table: Locator, previousRows: string[]): Promise<string[]> {
  let changedRows: string[] = [];
  await expect.poll(async () => {
    changedRows = await visibleRowSignatures(table);
    return changedRows.length > 1 && JSON.stringify(changedRows) !== JSON.stringify(previousRows);
  }).toBe(true);
  return changedRows;
}

test.describe('responsive dialogs, tables and forms', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2ECredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated scenarios.');
    await page.goto('/inventories/products');
    await expectAuthenticatedPage(page);
  });

  test('table overflow remains local', async ({ page }) => {
    const tableHost = page.locator('p-table[data-responsive-strategy]').first();
    const table = page.locator('.p-datatable').first();
    await expect(table).toBeVisible();
    await expect(tableHost).toHaveAttribute('data-responsive-strategy', 'scroll');
    await assertNoGlobalOverflow(page);
  });

  test('representative table keeps sorting, pagination and actions operable', async ({ page }) => {
    const table = page.locator('p-table[data-responsive-strategy]').first();
    const sortableHeader = table.locator('th.p-sortable-column').first();
    await expect(sortableHeader).toBeVisible();
    await expect.poll(async () => (await visibleRowSignatures(table)).length).toBeGreaterThan(1);
    const rowsBeforeSort = await visibleRowSignatures(table);
    const initialSort = await sortableHeader.getAttribute('aria-sort');
    await sortableHeader.click();
    await expect.poll(() => sortableHeader.getAttribute('aria-sort')).not.toBe(initialSort);
    const rowsAfterSort = await expectRowsToChange(table, rowsBeforeSort);
    expect(rowsAfterSort).not.toEqual(rowsBeforeSort);

    const paginator = page.locator('p-paginator').first();
    await expect(paginator).toBeVisible();
    const rowsPerPage = paginator.locator('.p-paginator-rpp-options');
    await rowsPerPage.click();
    await page.getByRole('option', { name: '10', exact: true }).click();
    await expect.poll(async () => {
      const rowCount = (await visibleRowSignatures(table)).length;
      return rowCount > 1 && rowCount <= 10;
    }).toBe(true);

    const firstPageRows = await visibleRowSignatures(table);
    expect(firstPageRows.length).toBeGreaterThan(1);
    const currentPageReport = paginator.locator('.p-paginator-current');
    await expect(currentPageReport).toBeVisible();
    const firstPageReport = (await currentPageReport.innerText()).trim();
    const nextPage = paginator.locator('.p-paginator-next');
    await expect(nextPage, 'Representative data must contain more than ten products.').toBeEnabled();
    await nextPage.click();
    await expect(currentPageReport).not.toHaveText(firstPageReport);
    const secondPageRows = await expectRowsToChange(table, firstPageRows);
    expect(secondPageRows).not.toEqual(firstPageRows);

    const pricesAction = table.getByRole('button', { name: 'Precios', exact: true }).first();
    await expect(pricesAction).toBeEnabled();
    await pricesAction.press('Enter');
    const actionDialog = page.getByRole('dialog', { name: /vista de precios/i });
    await expect(actionDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(actionDialog).toBeHidden();
    await expect(pricesAction).toBeFocused();
  });

  test('representative dialog stays inside the viewport', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /añadir/i }).first();
    await expect(addButton).toBeVisible();
    await addButton.focus();
    await addButton.click();
    const dialog = page.getByRole('dialog', { name: /registro producto|modificar producto/i });
    await expect(dialog).toBeVisible();
    await expectInsideViewport(page, dialog);
    await expectFocusInside(dialog);

    const focusableElements = dialog.locator(focusableSelector);
    expect(await focusableElements.count()).toBeGreaterThan(1);
    await focusableElements.first().focus();
    await page.keyboard.press('Shift+Tab');
    await expect(focusableElements.last()).toBeFocused();
    await focusableElements.last().focus();
    await page.keyboard.press('Tab');
    await expect(focusableElements.first()).toBeFocused();

    const footer = dialog.locator('.p-dialog-footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole('button', { name: /guardar/i })).toBeVisible();
    await expect(footer.getByRole('button', { name: /cancelar/i })).toBeVisible();

    await page.setViewportSize({ width: 720, height: 320 });
    await expectInsideViewport(page, dialog);
    await footer.scrollIntoViewIfNeeded();
    await expectInsideViewport(page, footer.getByRole('button', { name: /guardar/i }));
    await expectInsideViewport(page, footer.getByRole('button', { name: /cancelar/i }));
    await assertNoGlobalOverflow(page);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(addButton).toBeFocused();
  });
});
