import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const sass = require('sass');
const { chromium } = require('@playwright/test');
const css = sass.compileString(`@import 'src/assets/scss/design-system/operational-theme'; @import 'src/assets/scss/design-system/primary-buttons';`, { loadPaths: [process.cwd()], logger: sass.Logger.silent }).css;
const browser = await chromium.launch({ headless: true, ...(process.env.BUTTON_TEST_BROWSER ? { channel: process.env.BUTTON_TEST_BROWSER } : {}) });
try {
  const page = await browser.newPage();
  await page.setContent(`<style>${css}</style><button class="erp-btn erp-btn-primary"><i>+</i><span>Crear proveedor</span></button><button class="btn btn-primary">Registrar</button><button class="p-button"><span class="p-button-label">Actualizar</span></button><button class="bg-erp-success-soft"><span>Nuevo</span></button><button class="erp-btn erp-btn-primary" disabled>Guardar</button>`);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.body.dataset.bsTheme = theme, theme);
    for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 600 });
      const buttons = await page.locator('button').evaluateAll(buttons => buttons.map(button => {
        const style = getComputedStyle(button);
        return { background: style.backgroundColor, color: style.color, labels: [...button.children].map(child => getComputedStyle(child).color) };
      }));
      for (const button of buttons) {
        assert.equal(button.background, 'rgb(0, 169, 107)');
        assert.equal(button.color, 'rgb(255, 255, 255)');
        button.labels.forEach(color => assert.equal(color, 'rgb(255, 255, 255)'));
      }
    }
    await page.locator('button').first().hover();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('button').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(0, 140, 89)');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
  }
  console.log('Colores primarios correctos: 8 anchos, ambos temas, texto e iconos, disabled y hover. Verificación aislada de estilos compartidos.');
} finally { await browser.close(); }
