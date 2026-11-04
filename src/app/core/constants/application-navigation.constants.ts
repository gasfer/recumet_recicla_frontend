import { Data } from '@angular/router';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'reports';

export interface NavigationPermission {
  name: string;
  action: PermissionAction;
}

export interface NavigationDestination {
  path: `/${string}`;
  title: string;
  permission?: NavigationPermission;
  menuOnly?: boolean;
}

const destination = (
  path: `/${string}`,
  title: string,
  name?: string,
  action: PermissionAction = 'view',
  menuOnly = false,
): NavigationDestination => ({
  path,
  title,
  ...(menuOnly ? { menuOnly: true } : {}),
  ...(name ? { permission: { name, action } } : {}),
});

export const NAVIGATION_DESTINATIONS = {
  dashboard: destination('/dashboard/home', 'Dashboard'),
  reports: destination('/reports', 'Reportes'),

  providers: destination('/inputs/providers', 'Proveedores', 'PROVEEDORES'),
  providerList: destination('/inputs/provider-list', 'Lista de proveedores', 'LISTA PROVEEDORES'),
  providerPickup: destination('/providers/schedule-pickup', 'Agendar recojo', 'RECOJO', 'create', true),
  providerCertification: destination('/providers/certify', 'Certificar proveedor', 'CERTIFICAR', 'create', true),
  providerAccounts: destination('/providers/accounts', 'Cuentas de proveedor', 'CUENTAS PROVEEDOR', 'view', true),
  providerPurchases: destination('/providers/purchases', 'Compras por proveedor', 'COMPRAS PROVEEDOR', 'view', true),
  commercialReport: destination('/providers/commercial-report', 'Reporte comercial', 'REPORTE COMERCIAL', 'reports'),
  createPurchase: destination('/inputs/input-small', 'Realizar compras', 'COMPRAS', 'create'),
  queryPurchases: destination('/inputs/query-inputs', 'Consultar compras', 'CONSULTAR COMPRAS'),
  purchaseReport: destination('/inputs/purchase-report', 'Reporte de compras', 'REPORTE COMPRAS', 'reports'),
  createClassified: destination('/classifieds/classified', 'Realizar clasificados', 'CLASIFICADOS', 'create'),
  queryClassifieds: destination('/classifieds/query-classifieds', 'Consultar clasificados', 'CONSULTAR CLASIFICADOS'),

  truckScaleRegister: destination('/scale/truck-scale/register', 'Registrar pesaje camionero', 'REGISTRAR PESAJE CAMIONERA', 'create'),
  truckScaleQuery: destination('/scale/truck-scale/query', 'Consultar pesajes camioneros', 'CONSULTAR PESAJES CAMIONERA'),
  manualScaleRegister: destination('/scale/manual-scale/register', 'Registrar pesaje manual', 'REGISTRAR PESAJE MANUAL', 'create'),
  manualScaleQuery: destination('/scale/manual-scale/query', 'Consultar pesajes manuales', 'CONSULTAR PESAJES MANUALES'),
  scaleServiceRegister: destination('/scale/service/register', 'Registrar servicio de balanza', 'REGISTRAR SERVICIO', 'create'),
  scaleServiceQuery: destination('/scale/service/query', 'Consultar servicios de balanza', 'CONSULTAR SERVICIOS'),
  driverRegister: destination('/scale/drivers/register', 'Registrar transportista', 'REGISTRAR TRANSPORTISTA', 'create', true),
  driverQuery: destination('/scale/drivers/query', 'Consultar transportistas', 'CONSULTAR TRANSPORTISTAS', 'view', true),
  truckRegister: destination('/scale/trucks/register', 'Registrar camión', 'REGISTRAR CAMION', 'create', true),
  truckQuery: destination('/scale/trucks/query', 'Consultar camiones', 'CONSULTAR CAMIONES', 'view', true),

  clients: destination('/outputs/clients', 'Clientes', 'CLIENTES'),
  createSale: destination('/outputs/output', 'Realizar ventas', 'VENTAS', 'create'),
  querySales: destination('/outputs/query-outputs', 'Consultar ventas', 'CONSULTAR VENTAS'),
  salesReport: destination('/outputs/sales-report', 'Reporte de ventas', 'REPORTE VENTAS', 'reports'),
  dispatches: destination('/outputs/dispatches', 'Despachos', 'DESPACHOS'),
  createTransfer: destination('/transfers/transfer', 'Realizar traslado', 'TRASLADOS', 'create'),
  queryTransfers: destination('/transfers/query-transfers', 'Consultar traslados', 'CONSULTAR TRASLADOS'),
  queryReceptions: destination('/transfers/query-receptions', 'Consultar recepciones', 'RECEPCIONES'),
  reconciliations: destination('/transfers/reconciliations', 'Conciliaciones', 'TRANSFER_REVIEW'),

  cashDashboard: destination('/caja/adm-caja', 'Dashboard de caja', 'CAJA', 'create'),
  cashQuery: destination('/caja/query-caja', 'Consultar caja', 'CONSULTAR CAJA'),
  cashExpenses: destination('/caja/expenses', 'Gestión de gastos', 'GASTOS', 'view', true),
  cashMajorTransfers: destination('/caja/major-transfers', 'Transferencias (Mayor)', 'CAJA', 'view', true),
  financeReport: destination('/caja/finance-report', 'Reporte de finanzas', 'REPORTE FINANZAS', 'reports'),
  assetPurchaseRequest: destination('/assets/inputs/purchase-request', 'Solicitud de compra', 'GASTOS', 'view', true),
  assetPurchaseOrder: destination('/assets/inputs/purchase-order', 'Orden de compra', 'PERSONAL GASTOS', 'create', true),
  assetPurchaseManagement: destination('/assets/inputs/purchase-management', 'Gestión de compra', 'PERSONAL GASTOS', 'create', true),
  assetConsumables: destination('/assets/outputs/consumables', 'Insumos consumibles', 'GASTOS', 'view', true),
  assetTools: destination('/assets/outputs/tools', 'Herramientas', 'PERSONAL GASTOS', 'create', true),
  assetOutputManagement: destination('/assets/outputs/output-management', 'Gestión de salidas', 'PERSONAL GASTOS', 'create', true),
  accountsPayable: destination('/accounts/accounts-payable', 'Cuentas por pagar', 'CUENTAS POR PAGAR'),
  accountsReceivable: destination('/accounts/accounts-receivable', 'Cuentas por cobrar', 'CUENTAS POR COBRAR'),

  fixedAssetSupplies: destination('/inventories/fixed-assets/supplies', 'Insumos y consumibles', 'INSUMOS', 'view', true),
  fixedAssetMachinery: destination('/inventories/fixed-assets/machinery', 'Activo fijo - Maquinaria', 'AF MAQUINARIA', 'view', true),
  fixedAssetVehicles: destination('/inventories/fixed-assets/vehicles', 'Activo fijo - Vehículos', 'AF VEHICULOS', 'view', true),
  fixedAssetFurniture: destination('/inventories/fixed-assets/furniture-office', 'Activo fijo - Muebles y oficina', 'AF MUEBLES', 'view', true),
  rawMaterialKardex: destination('/inventories/kardex-fisico/mp', 'Kardex Materia Prima', 'KARDEX-FIS'),
  finishedProductKardex: destination('/inventories/kardex-fisico/pt', 'Kardex Productos Terminados', 'KARDEX-PT'),
  resaleItemKardex: destination('/inventories/kardex-fisico/ar', 'Kardex Artículos de Reventa', 'KARDEX-AR'),
  allProductKardex: destination('/inventories/kardex-fisico/all', 'Kardex de todos los productos', 'KARDEX-ALL'),
  totalStock: destination('/inventories/total-stock-recumet', 'Total Stock Recumet', 'KARDEX-ALL-FILTRO'),
  stockDiagnostic: destination('/inventories/stock-diagnostic', 'Ajuste diferencia Stock–Kardex', 'STOCK_RECONCILIATION'),
  kardexReport: destination('/inventories/kardex-report', 'Reporte de Kardex', 'REPORTE KARDEX', 'reports'),

  units: destination('/inventories/units', 'Unidades de medida', 'UND MEDIDA'),
  scales: destination('/inventories/scales', 'Balanzas', 'BALANZAS'),
  categories: destination('/inventories/categories', 'Categorías', 'CATEGORIAS'),
  products: destination('/inventories/products', 'Productos', 'PRODUCTOS'),
  users: destination('/managements/users', 'Usuarios', 'USUARIOS'),
  company: destination('/managements/company', 'Empresa', 'EMPRESA'),
  branches: destination('/managements/sucursales', 'Sucursales', 'SUCURSALES'),
  storages: destination('/managements/storages', 'Almacenes', 'ALMACENES'),
  transportCompanies: destination('/managements/trasport_company', 'Gestión de transportes', 'COMP. TRASPORTE'),
  managementReport: destination('/reports/management', 'Reporte gerencial', 'REPORTE GERENCIA', 'reports'),
  accountingReport: destination('/reports/accounting', 'Reporte de contabilidad', 'REPORTE CONTABILIDAD', 'reports'),
} as const satisfies Record<string, NavigationDestination>;

export const MENU_NAVIGATION_DESTINATIONS = Object.values(NAVIGATION_DESTINATIONS);

export const routeData = (
  target: NavigationDestination,
  breadcrumbs: Array<{ title: string; active?: boolean }>,
  additionalData: Data = {},
): Data => ({
  data: breadcrumbs,
  title: target.title,
  ...(target.permission ?? {}),
  ...additionalData,
});

export const childPath = (target: NavigationDestination, parentPath: `/${string}`): string => {
  const prefix = `${parentPath.replace(/\/$/, '')}/`;
  if (!target.path.startsWith(prefix)) {
    throw new Error(`La ruta ${target.path} no pertenece al prefijo ${parentPath}`);
  }
  return target.path.slice(prefix.length);
};
