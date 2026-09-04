export enum ProductAccessContext {
  Purchases = 'COMPRAS',
  Sales = 'VENTAS',
  Transfers = 'TRASLADOS',
  Classifieds = 'CLASIFICADOS',
}

export const PRODUCT_ACCESS_ROUTE_SEGMENTS: Readonly<Record<ProductAccessContext, string>> = {
  [ProductAccessContext.Purchases]: 'purchases',
  [ProductAccessContext.Sales]: 'sales',
  [ProductAccessContext.Transfers]: 'transfers',
  [ProductAccessContext.Classifieds]: 'classifieds',
};

export enum ProductCategoryType {
  RawMaterial = 'RAW_MATERIAL',
  FinishedProduct = 'FINISHED_PRODUCT',
  ResaleItem = 'RESALE_ITEM',
}

export const PRODUCT_CATEGORY_TYPE_OPTIONS = [
  { label: 'Materia prima (MP)', value: ProductCategoryType.RawMaterial },
  { label: 'Producto terminado (PT)', value: ProductCategoryType.FinishedProduct },
  { label: 'Artículo de reventa (AR)', value: ProductCategoryType.ResaleItem },
] as const;

export const PRODUCT_ACCESS_SECTION_TITLE = 'Tipos de producto permitidos por módulo';
export const PRODUCT_ACCESS_SECTION_DESCRIPTION =
  'Define qué tipos de producto podrá ver, seleccionar y utilizar el usuario en cada módulo. Esta configuración no habilita el acceso general al módulo.';
export const PRODUCT_ACCESS_MODULE_COLUMN_LABEL = 'Módulo de operación';

export const PRODUCT_ACCESS_CONTEXT_OPTIONS = [
  { label: 'Compras', value: ProductAccessContext.Purchases },
  { label: 'Ventas', value: ProductAccessContext.Sales },
  { label: 'Traslados', value: ProductAccessContext.Transfers },
  { label: 'Clasificados', value: ProductAccessContext.Classifieds },
] as const;
