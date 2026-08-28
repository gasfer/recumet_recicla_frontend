import {
  NAVIGATION_DESTINATIONS as ROUTES,
  NavigationDestination,
} from 'src/app/core/constants/application-navigation.constants';
import { MenuItem } from './menu.model';

const leaf = (
  id: number,
  label: string,
  target: NavigationDestination,
): MenuItem => ({
  id,
  label,
  link: target.path,
  name: target.permission?.name,
  action: target.permission?.action,
});

export const MENU: MenuItem[] = [
  { id: 0, label: 'MENUITEMS.DASHBOARDS.TEXT', isTitle: true },
  {
    ...leaf(1, 'MENUITEMS.DASHBOARDS.TEXT', ROUTES.dashboard),
    icon: 'fa-solid fa-chart-simple',
  },

  { id: 20, name: 'ENTRADAS_TITULO', label: 'MENUITEMS.ENTRADAS.TEXT', isTitle: true },
  {
    id: 21,
    name: 'PROVEEDORES_GRUPO',
    label: 'MENUITEMS.PROVEEDORES.TEXT',
    icon: 'fa-solid fa-users',
    subItems: [
      leaf(22, 'MENUITEMS.ENTRADAS.LIST.PROVEEDORES', ROUTES.providers),
      leaf(23, 'MENUITEMS.PROVEEDORES.LIST.AGENDAR', ROUTES.providerPickup),
      leaf(24, 'MENUITEMS.PROVEEDORES.LIST.CERTIFICAR', ROUTES.providerCertification),
      leaf(25, 'MENUITEMS.PROVEEDORES.LIST.CUENTAS', ROUTES.providerAccounts),
      leaf(26, 'MENUITEMS.PROVEEDORES.LIST.COMPRAS', ROUTES.providerPurchases),
    ],
  },
  {
    id: 27,
    name: 'COMPRAS_GRUPO',
    label: 'MENUITEMS.COMPRAS.TEXT',
    icon: 'fa-solid fa-truck',
    subItems: [
      leaf(28, 'MENUITEMS.ENTRADAS.LIST.PROVEEDORES', ROUTES.providers),
      leaf(29, 'MENUITEMS.ENTRADAS.LIST.REALIZARCOMPRAS', ROUTES.createPurchase),
      leaf(30, 'MENUITEMS.ENTRADAS.LIST.CONSULTARCOMPRAS', ROUTES.queryPurchases),
    ],
  },
  {
    id: 31,
    name: 'CLASIFICADOS_GRUPO',
    label: 'MENUITEMS.CLASIFICADOS.TEXT',
    icon: 'fa-solid fa-boxes-packing',
    subItems: [
      leaf(32, 'MENUITEMS.CLASIFICADOS.LIST.REALIZARCLASIFICADOS', ROUTES.createClassified),
      leaf(33, 'MENUITEMS.CLASIFICADOS.LIST.CONSULTARCLASIFICADOS', ROUTES.queryClassifieds),
    ],
  },

  { id: 40, name: 'BALANZA_TITULO', label: 'MENUITEMS.BALANZA.TEXT', isTitle: true },
  {
    id: 41,
    name: 'BALANZA_CAMIONERA_GRUPO',
    label: 'MENUITEMS.BALANZA.CAMIONERA.TEXT',
    icon: 'fa-solid fa-truck-fast',
    subItems: [
      leaf(42, 'MENUITEMS.BALANZA.CAMIONERA.REGISTRAR', ROUTES.truckScaleRegister),
      leaf(43, 'MENUITEMS.BALANZA.CAMIONERA.CONSULTAR', ROUTES.truckScaleQuery),
    ],
  },
  {
    id: 44,
    name: 'BALANZA_MANUAL_GRUPO',
    label: 'MENUITEMS.BALANZA.MANUAL.TEXT',
    icon: 'fa-solid fa-weight-scale',
    subItems: [
      leaf(45, 'MENUITEMS.BALANZA.MANUAL.REGISTRAR', ROUTES.manualScaleRegister),
      leaf(46, 'MENUITEMS.BALANZA.MANUAL.CONSULTAR', ROUTES.manualScaleQuery),
    ],
  },
  {
    id: 47,
    name: 'SERVICIO_BALANZA_GRUPO',
    label: 'MENUITEMS.BALANZA.SERVICIO.TEXT',
    icon: 'fa-solid fa-calculator',
    subItems: [
      leaf(48, 'MENUITEMS.BALANZA.SERVICIO.REGISTRAR', ROUTES.scaleServiceRegister),
      leaf(49, 'MENUITEMS.BALANZA.SERVICIO.CONSULTAR', ROUTES.scaleServiceQuery),
    ],
  },
  {
    id: 50,
    name: 'TRANSPORTISTAS_GRUPO',
    label: 'MENUITEMS.BALANZA.TRANSPORTISTAS.TEXT',
    icon: 'fa-solid fa-user-tie',
    subItems: [
      leaf(51, 'MENUITEMS.BALANZA.TRANSPORTISTAS.REGISTRAR', ROUTES.driverRegister),
      leaf(52, 'MENUITEMS.BALANZA.TRANSPORTISTAS.CONSULTAR', ROUTES.driverQuery),
    ],
  },
  {
    id: 53,
    name: 'CAMIONES_GRUPO',
    label: 'MENUITEMS.BALANZA.CAMIONES.TEXT',
    icon: 'fa-solid fa-truck-pickup',
    subItems: [
      leaf(54, 'MENUITEMS.BALANZA.CAMIONES.REGISTRAR', ROUTES.truckRegister),
      leaf(55, 'MENUITEMS.BALANZA.CAMIONES.CONSULTAR', ROUTES.truckQuery),
    ],
  },

  { id: 60, name: 'SALIDAS_TITULO', label: 'MENUITEMS.SALIDAS.TEXT', isTitle: true },
  {
    id: 61,
    name: 'VENTAS_GRUPO',
    label: 'MENUITEMS.VENTAS.TEXT',
    icon: 'fa-solid fa-cart-plus',
    subItems: [
      leaf(62, 'MENUITEMS.SALIDAS.LIST.CLIENTES', ROUTES.clients),
      leaf(63, 'MENUITEMS.SALIDAS.LIST.REALIZARVENTAS', ROUTES.createSale),
      leaf(64, 'MENUITEMS.SALIDAS.LIST.CONSULTARVENTAS', ROUTES.querySales),
    ],
  },
  {
    id: 80,
    name: 'TRASLADOS_GRUPO',
    label: 'MENUITEMS.TRASLADOS.TEXT',
    icon: 'fa-solid fa-truck-ramp-box',
    subItems: [
      leaf(81, 'MENUITEMS.TRASLADOS.LIST.REALIZARTRASLADOS', ROUTES.createTransfer),
      leaf(82, 'MENUITEMS.TRASLADOS.LIST.CONSULTARTRASLADOS', ROUTES.queryTransfers),
      leaf(83, 'MENUITEMS.TRASLADOS.LIST.CONSULTARRECEPCIONES', ROUTES.queryReceptions),
      leaf(84, 'MENUITEMS.TRASLADOS.LIST.CONCILIACIONES', ROUTES.reconciliations),
    ],
  },

  { id: 100, name: 'CAJA_TITULO', label: 'MENUITEMS.ADMCAJA.TEXT', isTitle: true },
  {
    id: 101,
    name: 'CAJA_GRUPO',
    label: 'MENUITEMS.CAJA.TEXT',
    icon: 'fa-solid fa-vault',
    subItems: [
      leaf(102, 'Dashboard Caja', ROUTES.cashDashboard),
      leaf(103, 'Consultar Caja', ROUTES.cashQuery),
      leaf(104, 'Gestión de Gastos', ROUTES.cashExpenses),
      leaf(105, 'Transferencias (Mayor)', ROUTES.cashMajorTransfers),
    ],
  },
  {
    id: 110,
    name: 'INGRESO_ACTIVOS_GRUPO',
    label: 'Ingreso activos',
    icon: 'fa-solid fa-money-bill-transfer',
    subItems: [
      leaf(111, 'Solicitud de compra', ROUTES.assetPurchaseRequest),
      leaf(112, 'Orden de compra', ROUTES.assetPurchaseOrder),
      leaf(113, 'Gestión de compra', ROUTES.assetPurchaseManagement),
    ],
  },
  {
    id: 120,
    name: 'SALIDA_ACTIVOS_GRUPO',
    label: 'Salida activos',
    icon: 'fa-solid fa-money-bill-transfer',
    subItems: [
      leaf(121, 'Insumos consumibles', ROUTES.assetConsumables),
      leaf(122, 'Herramientas', ROUTES.assetTools),
      leaf(123, 'Gestión de salidas', ROUTES.assetOutputManagement),
    ],
  },
  {
    id: 130,
    name: 'CUENTAS_GRUPO',
    label: 'MENUITEMS.CUENTAS.TEXT',
    icon: 'fa-solid fa-comments-dollar',
    subItems: [
      leaf(131, 'MENUITEMS.CUENTAS.LIST.CUENTASPORPAGAR', ROUTES.accountsPayable),
      leaf(132, 'MENUITEMS.CUENTAS.LIST.CUENTASPORCOBRAR', ROUTES.accountsReceivable),
    ],
  },

  { id: 140, name: 'INVENTARIO_TITULO', label: 'MENUITEMS.INVENTARIO.TEXT', isTitle: true },
  {
    id: 141,
    name: 'ACTIVO_FIJO_GRUPO',
    label: 'Inv. activo Fijo',
    icon: 'fa-solid fa-boxes-stacked',
    subItems: [
      leaf(142, 'Insumos y Consumibles', ROUTES.fixedAssetSupplies),
      leaf(143, 'AF Maquinaria', ROUTES.fixedAssetMachinery),
      leaf(144, 'AF Vehículos', ROUTES.fixedAssetVehicles),
      leaf(145, 'AF Muebles y Oficina', ROUTES.fixedAssetFurniture),
    ],
  },
  {
    id: 146,
    name: 'KARDEX_GRUPO',
    label: 'MENUITEMS.INVENTARIO.TEXT',
    icon: 'fa-solid fa-warehouse',
    subItems: [
      leaf(147, '(MP) Materia Prima', ROUTES.rawMaterialKardex),
      leaf(148, '(PT) Productos Terminados', ROUTES.finishedProductKardex),
      leaf(149, '(AR) Artículos de Reventa', ROUTES.resaleItemKardex),
      leaf(150, 'Todos los Productos', ROUTES.allProductKardex),
      leaf(151, 'Total Stock Recumet', ROUTES.totalStock),
    ],
  },

  { id: 160, name: 'ADMINISTRACION_TITULO', label: 'MENUITEMS.ADMINISTRACION.TEXT', isTitle: true },
  {
    id: 161,
    name: 'ALMACEN_GRUPO',
    label: 'MENUITEMS.ALMACEN.TEXT',
    icon: 'fa-solid fa-warehouse',
    subItems: [
      leaf(162, 'MENUITEMS.ALMACEN.LIST.UNIDADMEDIDA', ROUTES.units),
      leaf(163, 'MENUITEMS.ALMACEN.LIST.BALANZAS', ROUTES.scales),
      leaf(164, 'MENUITEMS.ALMACEN.LIST.CATEGORIAS', ROUTES.categories),
      leaf(165, 'MENUITEMS.ALMACEN.LIST.PRODUCTOS', ROUTES.products),
    ],
  },
  {
    id: 166,
    name: 'CONFIGURACION_GRUPO',
    label: 'Configuración',
    icon: 'fa-solid fa-gears',
    subItems: [
      leaf(167, 'MENUITEMS.GESTION.LIST.USUARIOS', ROUTES.users),
      leaf(168, 'MENUITEMS.GESTION.LIST.EMPRESA', ROUTES.company),
      leaf(169, 'MENUITEMS.GESTION.LIST.SUCURSALES', ROUTES.branches),
      leaf(170, 'MENUITEMS.GESTION.LIST.ALMACENES', ROUTES.storages),
      leaf(171, 'MENUITEMS.GESTION.LIST.TRASPORTES', ROUTES.transportCompanies),
    ],
  },
];
