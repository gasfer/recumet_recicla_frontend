import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const serviceCode = readFileSync(new URL('../src/app/pages/inventories/services/kardex.service.ts', import.meta.url), 'utf8');
const componentCode = readFileSync(new URL('../src/app/pages/inventories/total-stock-recumet/total-stock-recumet.component.ts', import.meta.url), 'utf8');
const templateCode = readFileSync(new URL('../src/app/pages/inventories/total-stock-recumet/total-stock-recumet.component.html', import.meta.url), 'utf8');

// 1. Servicio Angular contiene método de llamada al nuevo endpoint
assert.match(
  serviceCode,
  /getReportExcelConsolidatedTotalStock\(/,
  'El servicio kardex.service.ts debe exponer el método getReportExcelConsolidatedTotalStock.'
);
assert.match(
  serviceCode,
  /\/kardex\/total-stock-recumet\/excel-consolidated\?/,
  'El método getReportExcelConsolidatedTotalStock debe invocar la ruta /kardex/total-stock-recumet/excel-consolidated.'
);

// 2. Template contiene el botón Exportar reportes con permisos
assert.match(
  templateCode,
  /label="Exportar reportes"/,
  'El botón principal debe rotularse "Exportar reportes".'
);
assert.match(
  templateCode,
  /validatorsService\.withPermission\('KARDEX',\s*'reports'\)/,
  'El botón de reportes debe requerir el permiso KARDEX reports.'
);

// 3. Menú contiene las tres exportaciones identificadas
assert.match(
  componentCode,
  /label:\s*'Resumen de stock \(PDF\)'/,
  'Debe existir la opción "Resumen de stock (PDF)".'
);
assert.match(
  componentCode,
  /label:\s*'Listado de stock \(Excel\)'/,
  'Debe existir la opción "Listado de stock (Excel)".'
);
assert.match(
  componentCode,
  /label:\s*'Consolidado de inventario \(Excel\)'/,
  'Debe existir la opción "Consolidado de inventario (Excel)".'
);

// 4. Descarga segura y liberación de URL
assert.match(
  componentCode,
  /downloadConsolidatedExcelReport\(\)/,
  'El componente debe implementar downloadConsolidatedExcelReport.'
);
assert.match(
  componentCode,
  /window\.URL\.revokeObjectURL/,
  'El componente debe revocar la URL del Blob descargado.'
);
assert.match(
  componentCode,
  /consolidado_inventario_/,
  'El nombre del archivo debe iniciar con consolidado_inventario_.'
);

console.log('Verificación de Exportar reportes y consolidado de inventario completada exitosamente.');
