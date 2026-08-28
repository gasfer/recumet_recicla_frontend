import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const prominentBinding = '[prominentProductCode]="true"';

const includedTemplates = [
  'src/app/pages/inputs/input-small/input-small.component.html',
  'src/app/pages/outputs/output/output.component.html',
  'src/app/pages/transfers/transfer/transfer.component.html',
  'src/app/pages/classifieds/classified/classified.component.html',
];

for (const template of includedTemplates) {
  const content = read(template);
  assert.match(content, /<app-dataview-products\b/);
  assert.equal(
    content.split(prominentBinding).length - 1,
    1,
    `${template} debe activar una sola vez el código prominente`,
  );
}

const expensesTemplate = read(
  'src/app/pages/Expenses/input-small/input-small.component.html',
);
assert.match(expensesTemplate, /<app-dataview-products\b/);
assert.ok(
  !expensesTemplate.includes(prominentBinding),
  'Expenses debe conservar la presentación predeterminada',
);

const component = read(
  'src/app/core/components/dataview-products/dataview-products.component.ts',
);
assert.match(component, /@Input\(\) prominentProductCode:\s*boolean\s*=\s*false;/);

const componentTemplate = read(
  'src/app/core/components/dataview-products/dataview-products.component.html',
);
assert.match(
  componentTemplate,
  /\[class\.top-badges--prominent\]="prominentProductCode"/,
);

const styles = read(
  'src/app/core/components/dataview-products/dataview-products.component.scss',
);
assert.match(styles, /&--prominent\s*\{/);
assert.match(styles, /font-weight:\s*800;/);
assert.match(styles, /overflow-wrap:\s*anywhere;/);

console.log('Product card prominence contract verified.');
