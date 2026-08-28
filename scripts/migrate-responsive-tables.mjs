import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appRoot = join(projectRoot, 'src', 'app');
const sharedConsumerStrategyByFile = new Map([
  ...[
    'src/app/pages/accounts/accounts-payable/accounts-payable.component.html',
    'src/app/pages/accounts/accounts-receivable/accounts-receivable.component.html',
    'src/app/pages/caja/query-caja/query-caja.component.html',
    'src/app/pages/classifieds/query-classifieds/query-classifieds.component.html',
    'src/app/pages/Expenses/providers/providers.component.html',
    'src/app/pages/Expenses/query-inputs/query-inputs.component.html',
    'src/app/pages/inputs/providers/providers.component.html',
    'src/app/pages/inputs/query-inputs/query-inputs.component.html',
    'src/app/pages/inventories/kardex-existencia/kardex-existencia.component.html',
    'src/app/pages/inventories/kardex-fisico/kardex-fisico.component.html',
    'src/app/pages/inventories/kardex/kardex.component.html',
    'src/app/pages/inventories/products/products.component.html',
    'src/app/pages/inventories/total-stock-recumet/total-stock-recumet.component.html',
    'src/app/pages/managements/company/company.component.html',
    'src/app/pages/managements/sucursales/sucursales.component.html',
    'src/app/pages/managements/trasport-company/trasport-company.component.html',
    'src/app/pages/managements/users/users.component.html',
    'src/app/pages/outputs/clients/clients.component.html',
    'src/app/pages/outputs/query-outputs/query-outputs.component.html',
    'src/app/pages/transfers/query-receptions/query-receptions.component.html',
    'src/app/pages/transfers/query-transfers/query-transfers.component.html',
  ].map((file) => [file, 'scroll']),
  ...[
    'src/app/pages/caja/adm-caja/adm-caja.component.html',
    'src/app/pages/dashboard/home/home.component.html',
    'src/app/pages/Expenses/providers/components/modal-sectors/modal-sectors.component.html',
    'src/app/pages/inputs/providers/components/modal-sectors/modal-sectors.component.html',
    'src/app/pages/inventories/categories/categories.component.html',
    'src/app/pages/inventories/products/components/modal-prices/modal-prices.component.html',
    'src/app/pages/inventories/products/components/modal-providers-product/modal-providers-product.component.html',
    'src/app/pages/inventories/scales/scales.component.html',
    'src/app/pages/inventories/units/units.component.html',
    'src/app/pages/managements/storages/storages.component.html',
    'src/app/pages/managements/trasport-company/components/modal-cargo-trucks/modal-cargo-trucks.component.html',
    'src/app/pages/managements/trasport-company/components/modal-chauffeurs/modal-chauffeurs.component.html',
  ].map((file) => [file, 'stack']),
]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extname(entry.name) === '.html' ? [fullPath] : [];
  });
}

function appendStaticClass(tag, className) {
  if (new RegExp(`\\b${className}\\b`).test(tag)) return tag;
  if (/\sstyleClass\s*=\s*['"]/i.test(tag)) {
    return tag.replace(/styleClass\s*=\s*(['"])([^'"]*)\1/i, (_match, quote, classes) => `styleClass=${quote}${classes} ${className}${quote}`);
  }
  if (/\s\[styleClass\]\s*=\s*"'[^']*'"/i.test(tag)) {
    return tag.replace(/\[styleClass\]\s*=\s*"'([^']*)'"/i, `styleClass="$1 ${className}"`);
  }
  return tag.replace(/\s*>$/, ` styleClass="${className}">`);
}

let primeTables = 0;
let nativeTables = 0;
let sharedConsumers = 0;
const classifiedConsumerFiles = new Set();

for (const file of walk(appRoot)) {
  const original = readFileSync(file, 'utf8');
  const sourcePath = relative(projectRoot, file).replaceAll('\\', '/');
  let updated = original.replace(/<app-table(?=[\s>])[\s\S]*?>/gi, (openingTag) => {
    const strategy = sharedConsumerStrategyByFile.get(sourcePath);
    if (!strategy) throw new Error(`Missing shared table classification for ${sourcePath}`);
    const existing = openingTag.match(/\bresponsiveStrategy\s*=\s*['"](stack|scroll)['"]/i)?.[1]?.toLowerCase();
    if (existing && existing !== strategy) {
      throw new Error(`Shared table classification mismatch in ${sourcePath}: ${existing} != ${strategy}`);
    }
    classifiedConsumerFiles.add(sourcePath);
    sharedConsumers += 1;
    return existing
      ? openingTag
      : openingTag.replace(/^<app-table\b/i, `<app-table responsiveStrategy="${strategy}"`);
  });

  updated = updated.replace(/<p-table\b[\s\S]*?>/gi, (openingTag) => {
    if (/\[attr\.data-responsive-strategy\]/i.test(openingTag)) {
      primeTables += 1;
      return openingTag;
    }
    const strategy = /responsiveLayout\s*=\s*['"]stack['"]/i.test(openingTag) ? 'stack' : 'scroll';
    let next = appendStaticClass(openingTag, strategy === 'stack' ? 'app-table--stack' : 'app-table-scroll');
    if (!/\[?responsiveLayout\]?\s*=/i.test(next)) next = next.replace(/\s*>$/, ' responsiveLayout="scroll">');
    primeTables += 1;
    return next;
  });

  updated = updated.replace(/<table\b[\s\S]*?>/gi, (openingTag) => {
    let next = openingTag;
    if (!/\bapp-table-scroll\b/.test(next)) {
      if (/\sclass\s*=\s*['"]/i.test(next)) {
        next = next.replace(/class\s*=\s*(['"])([^'"]*)\1/i, (_match, quote, classes) => `class=${quote}${classes} app-table-scroll${quote}`);
      } else {
        next = next.replace(/\s*>$/, ' class="app-table-scroll">');
      }
    }
    if (!/\stabindex\s*=/.test(next)) next = next.replace(/\s*>$/, ' tabindex="0">');
    if (!/\saria-label\s*=/.test(next)) next = next.replace(/\s*>$/, ' aria-label="Tabla con desplazamiento horizontal">');
    nativeTables += 1;
    return next;
  });

  if (updated !== original) writeFileSync(file, updated);
}

const missingMappedFiles = [...sharedConsumerStrategyByFile.keys()]
  .filter((file) => !classifiedConsumerFiles.has(file));
if (missingMappedFiles.length) {
  throw new Error(`Mapped files without <app-table> consumers:\n${missingMappedFiles.join('\n')}`);
}
if (sharedConsumers !== 46) throw new Error(`Expected 46 shared table consumers, found ${sharedConsumers}.`);

console.log(`Responsive strategy applied to ${primeTables} PrimeNG tables, ${nativeTables} native tables and ${sharedConsumers} shared table consumers.`);
