import { PermissionAction } from './application-navigation.constants';

export const PERMISSION_MODULE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  PROVEEDORES: 'Proveedores',
  RECOJO: 'Recojo',
  CERTIFICAR: 'Certificación de proveedores',
  'CUENTAS PROVEEDOR': 'Cuentas de proveedor',
  'COMPRAS PROVEEDOR': 'Compras por proveedor',
  COMPRAS: 'Compras',
  'CONSULTAR COMPRAS': 'Consulta de compras',
  CLASIFICADOS: 'Clasificados',
  'CONSULTAR CLASIFICADOS': 'Consulta de clasificados',
  'REGISTRAR PESAJE CAMIONERA': 'Registro de pesaje camionero',
  'CONSULTAR PESAJES CAMIONERA': 'Consulta de pesajes camioneros',
  'REGISTRAR PESAJE MANUAL': 'Registro de pesaje manual',
  'CONSULTAR PESAJES MANUALES': 'Consulta de pesajes manuales',
  'REGISTRAR SERVICIO': 'Registro de servicio de balanza',
  'CONSULTAR SERVICIOS': 'Consulta de servicios de balanza',
  'REGISTRAR TRANSPORTISTA': 'Registro de transportista',
  'CONSULTAR TRANSPORTISTAS': 'Consulta de transportistas',
  'REGISTRAR CAMION': 'Registro de camión',
  'CONSULTAR CAMIONES': 'Consulta de camiones',
  CLIENTES: 'Clientes',
  VENTAS: 'Ventas',
  'CONSULTAR VENTAS': 'Consulta de ventas',
  TRASLADOS: 'Traslados',
  'CONSULTAR TRASLADOS': 'Consulta de traslados',
  RECEPCIONES: 'Recepciones',
  TRANSFER_REVIEW: 'Revisión de traslados',
  CAJA: 'Caja',
  'CONSULTAR CAJA': 'Consulta de caja',
  GASTOS: 'Gastos',
  'PERSONAL GASTOS': 'Personal de gastos',
  'CUENTAS POR PAGAR': 'Cuentas por pagar',
  'CUENTAS POR COBRAR': 'Cuentas por cobrar',
  'KARDEX-FIS': 'Kardex físico',
  'KARDEX-PT': 'Kardex de producto terminado',
  'KARDEX-AR': 'Kardex de artículos de reventa',
  'KARDEX-ALL': 'Kardex de todos los productos',
  'KARDEX-ALL-FILTRO': 'Consulta total de existencias',
  STOCK_RECONCILIATION: 'Ajuste diferencia Stock–Kardex',
  INSUMOS: 'Insumos',
  'AF MAQUINARIA': 'Activo fijo: maquinaria',
  'AF VEHICULOS': 'Activo fijo: vehículos',
  'AF MUEBLES': 'Activo fijo: muebles y oficina',
  'UND MEDIDA': 'Unidades de medida',
  BALANZAS: 'Balanzas',
  CATEGORIAS: 'Categorías',
  PRODUCTOS: 'Productos',
  USUARIOS: 'Usuarios',
  EMPRESA: 'Empresa',
  SUCURSALES: 'Sucursales',
  ALMACENES: 'Almacenes',
  'COMP. TRASPORTE': 'Compañías de transporte',
  'REPORTE COMERCIAL': 'Reporte comercial',
  'REPORTE COMPRAS': 'Reporte de compras',
  'REPORTE VENTAS': 'Reporte de ventas',
  DESPACHOS: 'Despachos',
  'REPORTE FINANZAS': 'Reporte de finanzas',
  'REPORTE KARDEX': 'Reporte de Kardex',
  'REPORTE GERENCIA': 'Reporte de gerencia',
  'REPORTE CONTABILIDAD': 'Reporte de contabilidad',
});

export const PERMISSION_ACTION_LABELS: Readonly<Record<PermissionAction, string>> = Object.freeze({
  view: 'Ver',
  create: 'Crear',
  update: 'Modificar',
  delete: 'Eliminar',
  reports: 'Reportes',
});

export const TRANSFER_REVIEW_ACTION_HELP = 'Ver: consultar · Crear: asignar · Modificar: resolver · Eliminar: reabrir · Reportes: aprobar';
export const STOCK_RECONCILIATION_ACTION_HELP = 'Ver: consultar casos · Crear: investigar · Modificar: regularizar · Reportes: autorizar';

export const permissionModuleLabel = (module: string): string => (
  PERMISSION_MODULE_LABELS[module] || module
);

export const permissionActionLabel = (action: PermissionAction): string => (
  PERMISSION_ACTION_LABELS[action]
);
