import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { HtmlParser } from '@angular/compiler';
import { chromium } from '@playwright/test';

const modules = ['inputs', 'Expenses', 'classifieds', 'outputs', 'inventories', 'accounts', 'caja', 'balanza', 'transfers'];
const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
const parser = new HtmlParser();
const output = 'docs/quality/design-system';
fs.mkdirSync(output, { recursive: true });
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
function contract(source, file) {
  const parsed = parser.parse(source, file);
  if (parsed.errors.length) throw new Error(`${file}: ${parsed.errors.join('\n')}`);
  function serialize(node) {
    return { name: node.name, value: node.value,
      attrs: node.attrs?.filter(a => !['class', 'styleClass', 'icon'].includes(a.name)).map(a => [a.name, a.value]),
      children: node.children?.map(serialize) };
  }
  return JSON.stringify(parsed.rootNodes.map(serialize));
}
const contracts = [];
for (const module of modules) {
  let checked = 0, changed = 0;
  for (const file of files(`src/app/pages/${module}`).filter(f => f.endsWith('.html'))) {
    const original = execFileSync('git', ['show', `HEAD:${file.replaceAll('\\', '/')}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const current = fs.readFileSync(file, 'utf8');
    if (original !== current) {
      if (contract(original, file) !== contract(current, file)) throw new Error(`Non-presentation contract changed: ${file}`);
      changed++;
    }
    checked++;
  }
  contracts.push({ module, checkedTemplates: checked, changedTemplates: changed, bindingsAndContentPreserved: true });
}
const stylesFileName = fs.readdirSync('dist/frontend_recumet').find(f => f.startsWith('styles') && f.endsWith('.css'));
const css = fs.readFileSync(path.join('dist/frontend_recumet', stylesFileName), 'utf8');
const markup = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body data-bs-theme="light"><main class="erp-card" style="margin:12px;max-width:1100px">
<h1 class="erp-text-heading">Presentación RECUMET — controles compartidos</h1>
<p class="text-erp-text-muted">Fixture de estilos compilados. No representa una sesión autenticada ni prueba operaciones.</p>
<section class="erp-section"><div class="erp-form-grid cols-3">
<div class="erp-field"><label class="erp-label" for="name">Proveedor y razón social</label><input id="name" class="erp-input p-inputtext w-full" value="RECUMET INDUSTRIAL"></div>
<div class="erp-field"><label class="erp-label">Sucursal</label><div class="p-dropdown erp-input w-full"><span class="p-dropdown-label">La Paz</span></div></div>
<div class="erp-field"><label class="erp-label">Monto</label><input class="erp-input p-inputtext w-full" value="123.456,78"></div>
<div class="erp-field erp-col-2"><label class="erp-label">Observación extensa</label><input class="erp-input p-inputtext w-full" placeholder="Detalle de la operación"></div></div></section>
<div class="flex flex-wrap gap-2"><button class="erp-btn erp-btn-primary">Guardar</button><button class="erp-btn erp-btn-secondary">Cancelar</button><button class="erp-btn erp-btn-danger">Eliminar</button></div>
<div class="flex flex-wrap gap-2 mt-3"><span class="erp-badge erp-badge-success">Validado</span><span class="erp-badge erp-badge-warning">Pendiente</span><span class="erp-badge erp-badge-danger">Error</span><span class="erp-badge erp-badge-info">Información</span></div>
<div class="p-dropdown-panel mt-3"><ul class="p-dropdown-items"><li class="p-dropdown-item p-highlight">Opción seleccionada</li><li class="p-dropdown-item">Otra opción</li></ul></div>
<div class="flex flex-wrap erp-layout-row mt-3"><div class="w-full md:w-[58.333333333333336%] min-w-0 px-2"><section class="erp-section">Detalle de operación</section></div><div class="w-full md:w-[41.66666666666667%] min-w-0 px-2"><section class="erp-section">Totalizadores</section></div></div>
</main></body></html>`;
function luminance(rgb) {
  const values = rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const matrix = [];
try {
  await page.setContent(markup);
  await page.addStyleTag({ content: css });
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.body.setAttribute('data-bs-theme', theme), theme);
    for (const width of widths) {
      for (const height of [568, 600]) {
      await page.setViewportSize({ width, height });
      // Existing controls animate their paint; inspect the settled state.
      await page.waitForTimeout(250);
      const snapshot = await page.evaluate(() => {
        const grid = document.querySelector('.erp-form-grid');
        const input = document.querySelector('#name');
        const pair = selector => { const style = getComputedStyle(document.querySelector(selector)); return { foreground: style.color, background: style.backgroundColor }; };
        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          inputHeight: input.getBoundingClientRect().height,
          pairs: Object.fromEntries(['.erp-btn-primary', '.erp-btn-secondary', '.erp-badge-success', '.erp-badge-warning', '.erp-badge-danger', '.erp-badge-info', '.p-dropdown-item.p-highlight'].map(s => [s, pair(s)])),
        };
      });
      const expectedColumns = width < 768 ? 1 : width < 1024 ? 2 : 3;
      const contrasts = Object.entries(snapshot.pairs).map(([selector, pair]) => {
        const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
        const a = luminance(rgb(pair.foreground)), b = luminance(rgb(pair.background));
        return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      });
      const passed = !snapshot.overflow && snapshot.columns === expectedColumns && (snapshot.inputHeight === 32 || snapshot.inputHeight === 38) && contrasts.every(c => c.ratio >= 4.5);
      matrix.push({ theme, width, height, ...snapshot, contrasts, passed });
      if (height === 600 && [320, 768, 1440].includes(width)) await page.screenshot({ path: `${output}/shared-${theme}-${width}.png`, fullPage: true });
      }
    }
  }
  await page.locator('.erp-btn-primary').focus();
  const focus = await page.locator('.erp-btn-primary').evaluate(element => ({ width: getComputedStyle(element).outlineWidth, style: getComputedStyle(element).outlineStyle }));
  const report = { scope: 'Static template contract checks and compiled shared-style fixture; authenticated module flows NOT executed', contracts, matrix, focus };
  fs.writeFileSync(`${output}/presentation-results.json`, JSON.stringify(report, null, 2));
  if (matrix.some(result => !result.passed) || focus.style === 'none') throw new Error(`Presentation failures: ${matrix.filter(r => !r.passed).map(r => `${r.theme}/${r.width}`).join(', ')}`);
  console.log(JSON.stringify({ contracts, passedPresentationCases: matrix.length, focus }, null, 2));
} finally { await browser.close(); }
