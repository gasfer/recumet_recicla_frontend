import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/app/pages/inventories/kardex-fisico/kardex-fisico.component.ts', import.meta.url), 'utf8');
const template = readFileSync(new URL('../src/app/pages/inventories/kardex-fisico/kardex-fisico.component.html', import.meta.url), 'utf8');

assert.match(component, /activeView = signal\(this\.PHYSICAL_SUMMARY\)/, 'El resumen físico debe ser la vista base del componente.');
assert.ok(!component.includes("label: 'TODOS'"), 'La pestaña TODOS debe quedar descartada de la interfaz.');
assert.match(component, /this\.activeView\.set\(this\.PHYSICAL_SUMMARY\)/, 'Todos los Productos debe abrir directamente el resumen físico.');
assert.match(component, /label: 'RESUMEN FÍSICO'/, 'Debe existir la vista de resumen físico.');
assert.match(component, /getAllAndSearchKardexFisico\(/, 'El resumen debe conservar su consulta agregada.');
assert.match(component, /rows = signal\(50\)/, 'El resumen debe paginar de 50 en 50 por defecto.');

assert.match(template, /activeView\(\) === PHYSICAL_SUMMARY[\s\S]*<app-table/, 'El resumen físico debe conservar la tabla compartida.');
assert.match(template, /<p-tabMenu[\s\S]*\[model\]="searchItems\(\)"/, 'Las vistas deben ofrecerse por menú de pestañas.');
assert.match(template, /\(rows\$\)="paginate\(\$event\)"/, 'El resumen debe conservar su paginación.');
assert.match(template, /\(search\$\)="search\(\$event\)"/, 'El resumen debe conservar su búsqueda.');

for (const helper of ['paginate', 'getAllAndSearchKardexFisico']) {
  assert.match(component, new RegExp(`\\b${helper}\\b`), `Falta el método ${helper}.`);
}

console.log('Verificación de Kardex físico de todos los productos completada.');
