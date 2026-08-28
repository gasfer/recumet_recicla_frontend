import { expect, test } from '@playwright/test';

const useContextWithOpenReviews = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('id_sucursal', '1');
    localStorage.setItem('id_storage', '1');
  });
};

const useContextWithoutOpenReviews = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => {
    localStorage.setItem('id_sucursal', '8');
    localStorage.setItem('id_storage', '8');
  });
};

test.describe('revisiones inconclusas de recepción', () => {
  test('el aviso se puede cerrar y no bloquea el trabajo durante la sesión', async ({ page }) => {
    await useContextWithOpenReviews(page);
    await page.goto('/');

    const alertDialog = page.getByRole('dialog', { name: 'Recepciones inconclusas' });
    await expect(alertDialog).toBeVisible();
    await expect(page.locator('.p-dialog-mask')).toHaveCount(0);

    await alertDialog.getByRole('button', { name: 'Continuar trabajando' }).click();
    await expect(alertDialog).toBeHidden();
  });

  test('dirige la revisión a Recepciones inconclusas y abre la trazabilidad desde Opciones', async ({ page }) => {
    await useContextWithOpenReviews(page);
    await page.goto('/');

    const alertDialog = page.getByRole('dialog', { name: 'Recepciones inconclusas' });
    await expect(alertDialog).toBeVisible();
    await expect(alertDialog.getByText(/notas que requieren atención/i)).toBeVisible();
    await expect(alertDialog.getByRole('button', { name: /abrir trazabilidad/i })).toHaveCount(0);
    const goToReviewsButton = alertDialog.getByRole('button', { name: /ir a recepciones inconclusas/i });
    await expect(goToReviewsButton).toBeVisible();

    await goToReviewsButton.click();
    await expect(page).toHaveURL(/\/transfers\/query-receptions\?view=inconclusive/);

    const openTraceButton = page.getByRole('button', { name: /revisar notas inconclusas del traslado/i }).first();
    await expect(openTraceButton).toBeVisible();
    await openTraceButton.click();
    const traceDialog = page.getByRole('dialog', { name: 'Revisión de recepción' });
    await expect(traceDialog).toBeVisible();
    await expect(traceDialog.getByText(/TRAS0032[01]/).first()).toBeVisible();
    await expect(traceDialog.getByRole('heading', { name: /valores originales de la recepcion/i })).toBeVisible();
    await expect(traceDialog.getByText(/falta documentar \d+ diferencia/i).first()).toBeVisible();
    const reconcileButton = traceDialog.getByRole('button', { name: /conciliar diferencia/i }).first();
    await expect(reconcileButton).toBeVisible();
    await reconcileButton.click();

    await expect(traceDialog.getByText(/sin cambios de inventario/i).first()).toBeVisible();
    await expect(traceDialog.getByText(/stock y kardex permanecen iguales/i)).toBeVisible();
    await expect(traceDialog.getByText(/motivo comprobado/i)).toBeVisible();
    await expect(traceDialog.getByPlaceholder(/pesaje 1548/i)).toBeVisible();
    await expect(traceDialog.getByRole('button', { name: /confirmar y cerrar diferencia/i })).toBeVisible();
    await expect(traceDialog.getByText(/asignar responsable/i)).toHaveCount(0);
    await expect(traceDialog.getByText(/registrar accion realizada/i)).toHaveCount(0);

    const partialOption = traceDialog.getByText(/conciliar solo una parte/i);
    await expect(partialOption).toBeVisible();
    await partialOption.click();
    await expect(traceDialog.getByText(/cantidad a conciliar/i)).toBeVisible();

    const history = traceDialog.getByText(/ver trazabilidad/i).first();
    await expect(history).toBeVisible();
    await history.click();
    await expect(traceDialog.locator('.trace-timeline').first()).toBeVisible();

    const hasHorizontalOverflow = await traceDialog.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);

    await page.keyboard.press('Escape');
    await expect(traceDialog).toBeHidden();
    await expect(openTraceButton).toBeFocused();
  });

  test('las notificaciones leídas no suprimen el modal de revisiones', async ({ page, request }) => {
    await useContextWithOpenReviews(page);
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Recepciones inconclusas' })).toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem('token'));
    await request.put('http://127.0.0.1:3000/api/v1/notifications/read', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: { notificationIds: [] },
    });
    await page.reload();

    await expect(page.getByRole('dialog', { name: 'Recepciones inconclusas' })).toBeVisible();
  });

  test('no interrumpe un contexto sin pendientes y reacciona al cambiar de sucursal', async ({ page }) => {
    await useContextWithoutOpenReviews(page);
    await page.goto('/');

    const alertDialog = page.getByRole('dialog', { name: 'Recepciones inconclusas' });
    await expect(alertDialog).toBeHidden();

    await page.getByLabel('Sucursal').click();
    await page.getByRole('option', { name: 'CASA MATRIZ', exact: true }).click();

    await expect(alertDialog).toBeVisible();
  });
});
