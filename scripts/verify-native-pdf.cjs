const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const { buildSync } = require('esbuild');

async function main() {
  const output = path.resolve(__dirname, '../../recumet_recicla_backend/output/pdf/centralized');
  const sample = fs.readFileSync(path.join(output, 'purchase-sample.pdf'));
  const bundle = buildSync({
    stdin: { contents: `import '@angular/compiler';
      import { Observable } from 'rxjs';
      import { PdfDocumentActionsService } from './src/app/core/services/pdf-document-actions.service';
      const service = new PdfDocumentActionsService();
      document.querySelector('#pdf').addEventListener('click', () => {
        service.prepareRequest(new Observable(subscriber => {
          fetch('/sample.pdf').then(response => response.blob()).then(blob => { subscriber.next(blob); subscriber.complete(); });
        })).subscribe(blob => service.show(blob, 'compras-verificacion.pdf', 'Compras QA'));
      });`, resolveDir: path.resolve(__dirname, '..'), loader: 'ts' },
    bundle: true, write: false, format: 'iife', platform: 'browser', tsconfig: path.resolve(__dirname, '../tsconfig.app.json'),
  }).outputFiles[0].text;
  const server = http.createServer((req, res) => {
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(bundle); }
    if (req.url === '/sample.pdf') { res.setHeader('Content-Type', 'application/pdf'); return res.end(sample); }
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><meta charset="utf-8"><button id="pdf">Abrir PDF</button><script src="/bundle.js"></script>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  try {
    for (const channel of ['chrome', 'msedge']) {
      const browser = await chromium.launch({ channel, headless: true, ...(channel === 'msedge' ? { ignoreDefaultArgs: ['--edge-skip-compat-layer-relaunch'] } : {}) });
      try {
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(address);
        const popupPromise = page.waitForEvent('popup');
        await page.click('#pdf');
        const popup = await popupPromise;
        await popup.waitForSelector('iframe[src^="blob:"]');
        assert.equal(await popup.title(), 'Compras QA');
        assert.equal(await popup.locator('a[download]').getAttribute('download'), 'compras-verificacion.pdf');
        assert.equal(await popup.locator('canvas').count(), 0);
        const downloadPromise = popup.waitForEvent('download');
        await popup.locator('a[download]').click();
        const download = await downloadPromise;
        assert.equal(download.suggestedFilename(), 'compras-verificacion.pdf');
        const file = path.join(output, `${channel}-compras-verificacion.pdf`);
        await download.saveAs(file);
        assert.deepEqual(fs.readFileSync(file), sample);
        await popup.screenshot({ path: path.join(output, `${channel}-native-preview.png`) });
        assert.deepEqual(errors, []);
        results.push({ channel, version: browser.version(), preview: 'passed', download: 'passed; identical PDF bytes', canvas: false, physicalPrint: 'requires manual printer/dialog check' });
        fs.writeFileSync(path.join(output, 'native-browser-verification.json'), JSON.stringify(results, null, 2));
        await context.close();
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  fs.writeFileSync(path.join(output, 'native-browser-verification.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
