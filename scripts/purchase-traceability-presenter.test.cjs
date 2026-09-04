const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const file = resolve(__dirname, '../src/app/core/components/purchase-traceability-timeline/purchase-traceability-presenter.ts');
const compiled = new Module(file, module);
compiled._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const { groupEvents, displayValue, eventRows, eventLabel, eventTone } = compiled.exports;

test('traduce eventos, estados y datos booleanos sin exponer códigos técnicos', () => {
  assert.equal(eventLabel('ACCOUNT_PAYABLE_CREATED'), 'Cuenta por pagar registrada');
  assert.equal(eventLabel('LEGACY_HISTORY'), 'Antecedente histórico');
  assert.equal(displayValue('ACTIVE'), 'Activo');
  assert.equal(displayValue(false), 'No');
  assert.equal(displayValue(0, 'quantity'), '0');
});
test('agrupa una operación y separa usuarios y operaciones diferentes', () => {
  const base = { correlation_id: 'A', id_actor_user: 1, actor: { full_names: 'Ana', role: 'OPERADOR' } };
  const groups = groupEvents([
    { ...base, id: 1, event_type: 'PURCHASE_CREATED' },
    { ...base, id: 2, event_type: 'DETAIL_ADDED' },
    { ...base, id: 3, correlation_id: 'B', event_type: 'PURCHASE_UPDATED' },
    { ...base, id: 4, id_actor_user: 2, event_type: 'PAYMENT_CREATED' },
  ]);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].events.length, 2);
  assert.equal(groups[1].tone, 'warning');
});
test('no agrupa antecedentes sin correlación por coincidencia de fecha o usuario', () => {
  assert.equal(groupEvents([{ id: 1, id_actor_user: 1 }, { id: 2, id_actor_user: 1 }]).length, 2);
});
test('resume el registro con cantidad precio y total sin estado ni identificadores', () => {
  const rows = eventRows({ after_data: { status: 'ACTIVE', quantity: 50, cost: 14, total: 700 },
    changed_fields: [{ field: 'status', before: null, after: 'ACTIVE' }] });
  assert.equal(rows.length, 3);
  assert.equal(rows.find(row => row.field === 'total').after, '700');
  assert.equal(rows[0].before, 'Sin dato registrado');
});
test('respeta cambios a cero, falso y valores retirados', () => {
  const rows = eventRows({ event_type: 'PURCHASE_UPDATED', before_data: { quantity: 10, old_customer: true }, after_data: { quantity: 0, old_customer: false },
    changed_fields: [{ field: 'quantity', before: 10, after: 0 }, { field: 'old_customer', before: true, after: false }] });
  assert.equal(rows[0].after, '0');
  assert.equal(rows[1].after, 'No');
  assert.equal(eventRows({ before_data: { total: 100 } })[0].after, 'Sin dato registrado');
});
test('una edición muestra únicamente los valores que realmente cambiaron', () => {
  const rows = eventRows({ event_type: 'PRICE_CHANGED',
    before_data: { id: 1, quantity: '50.0000', cost: 10, total: 500, status: 'ACTIVE' },
    after_data: { id: 1, quantity: 50, cost: 12, total: 600, status: 'ACTIVE' },
    changed_fields: [{ field: 'cost', before: 10, after: 12 }, { field: 'total', before: 500, after: 600 }] });
  assert.deepEqual(rows.map(row => row.field), ['cost', 'total']);
  assert.equal(rows[0].before, '10');
  assert.equal(rows[0].after, '12');
});
test('no repite materiales ni la cuenta generada durante el registro de compra', () => {
  const base = { correlation_id: 'A', id_actor_user: 1 };
  const groups = groupEvents([
    { ...base, id: 1, event_type: 'PURCHASE_CREATED', after_data: { details: [{ id_product: 4, quantity: 50, cost: 10, total: 500 }] } },
    { ...base, id: 2, event_type: 'DETAIL_ADDED', after_data: { id_product: 4, quantity: 50, cost: 10, total: 500 } },
    { ...base, id: 3, event_type: 'ACCOUNT_PAYABLE_CREATED', after_data: { total: 500 } },
  ]);
  assert.equal(groups[0].events.length, 2);
  assert.deepEqual(groups[0].events[0].materials, []);
});
test('usa colores por acción y prioriza anulaciones sobre cambios y registros', () => {
  assert.equal(eventTone('DETAIL_ADDED'), 'success');
  assert.equal(eventTone('PRICE_CHANGED'), 'warning');
  assert.equal(eventTone('DETAIL_REMOVED'), 'danger');
  const groups = groupEvents(['PURCHASE_UPDATED', 'ACCOUNT_PAYABLE_VOIDED', 'DETAIL_ADDED'].map(event_type => ({ correlation_id: 'A', event_type })));
  assert.equal(groups[0].tone, 'danger');
});
