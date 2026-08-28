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
  { label: 'MP - Materia prima', value: ProductCategoryType.RawMaterial },
  { label: 'PT - Producto terminado', value: ProductCategoryType.FinishedProduct },
  { label: 'AR - Artículo de reventa', value: ProductCategoryType.ResaleItem },
] as const;

export const PRODUCT_ACCESS_CONTEXT_OPTIONS = [
  { label: 'Compras', value: ProductAccessContext.Purchases },
  { label: 'Ventas', value: ProductAccessContext.Sales },
  { label: 'Traslados', value: ProductAccessContext.Transfers },
  { label: 'Clasificados', value: ProductAccessContext.Classifieds },
] as const;
