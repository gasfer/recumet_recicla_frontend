import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoriesComponent } from './categories/categories.component';
import { ProductsComponent } from './products/products.component';
import { UnitsComponent } from './units/units.component';
import { ScalesComponent } from './scales/scales.component';
import { KardexComponent } from './kardex/kardex.component';
import { KardexFisicoComponent } from './kardex-fisico/kardex-fisico.component';
import { KardexExistenciaComponent } from './kardex-existencia/kardex-existencia.component';
import { ListCostsProductComponent } from './list-costs-product/list-costs-product.component';
import { TotalStockRecumetComponent } from './total-stock-recumet/total-stock-recumet.component';
import { StockDiagnosticComponent } from './stock-diagnostic/stock-diagnostic.component';
import { FeatureInDevelopmentComponent } from 'src/app/core/components/feature-in-development/feature-in-development.component';
import {
  NAVIGATION_DESTINATIONS as NAV,
  childPath,
  routeData,
} from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (section: string, title: string) => [
  { title: 'Administración' },
  { title: section },
  { title, active: true },
];

export const INVENTORY_ROUTES: Routes = [
  {
    path: childPath(NAV.products, '/inventories'),
    component: ProductsComponent,
    data: routeData(NAV.products, breadcrumb('Almacén', NAV.products.title)),
  },
  {
    path: childPath(NAV.categories, '/inventories'),
    component: CategoriesComponent,
    data: routeData(NAV.categories, breadcrumb('Almacén', NAV.categories.title)),
  },
  {
    path: childPath(NAV.units, '/inventories'),
    component: UnitsComponent,
    data: routeData(NAV.units, breadcrumb('Almacén', NAV.units.title)),
  },
  {
    path: childPath(NAV.scales, '/inventories'),
    component: ScalesComponent,
    data: routeData(NAV.scales, breadcrumb('Almacén', NAV.scales.title)),
  },
  {
    path: 'kardex',
    component: KardexComponent,
    data: { data: breadcrumb('Almacén', 'Kardex'), name: 'KARDEX' },
  },
  {
    path: childPath(NAV.rawMaterialKardex, '/inventories'),
    component: KardexFisicoComponent,
    data: routeData(NAV.rawMaterialKardex, breadcrumb('Inventario', 'Kardex Físico'), {
      category_types: 'RAW_MATERIAL',
      title: 'KARDEX Materia Prima (MP)',
    }),
  },
  {
    path: childPath(NAV.finishedProductKardex, '/inventories'),
    component: KardexFisicoComponent,
    data: routeData(NAV.finishedProductKardex, breadcrumb('Inventario', 'Kardex Físico'), {
      category_types: 'FINISHED_PRODUCT',
      title: 'KARDEX Productos Terminados (PT)',
    }),
  },
  {
    path: childPath(NAV.resaleItemKardex, '/inventories'),
    component: KardexFisicoComponent,
    data: routeData(NAV.resaleItemKardex, breadcrumb('Inventario', 'Kardex Físico'), {
      category_types: 'RESALE_ITEM',
      title: 'KARDEX Artículos de Reventa (AR)',
    }),
  },
  {
    path: childPath(NAV.allProductKardex, '/inventories'),
    component: KardexFisicoComponent,
    data: routeData(NAV.allProductKardex, breadcrumb('Inventario', 'Kardex Físico'), {
      category_types: '',
      title: 'KARDEX de todos los Productos',
    }),
  },
  {
    path: 'kardex-existencia',
    component: KardexExistenciaComponent,
    data: { data: breadcrumb('Inventario', 'Kardex de Existencia'), name: 'KARDEX' },
  },
  {
    path: 'list-products-prices',
    component: ListCostsProductComponent,
    data: {
      data: [
        { title: 'Administración' },
        { title: 'Almacén' },
        { title: 'Productos' },
        { title: 'Listado de precios', active: true },
      ],
      name: 'LISTADO DE PRECIOS',
    },
  },
  {
    path: childPath(NAV.totalStock, '/inventories'),
    component: TotalStockRecumetComponent,
    data: routeData(NAV.totalStock, breadcrumb('Inventario', NAV.totalStock.title), {
      title: 'Total Stock Recumet',
    }),
  },
  {
    path: childPath(NAV.stockDiagnostic, '/inventories'),
    component: StockDiagnosticComponent,
    data: routeData(NAV.stockDiagnostic, breadcrumb('Inventario', 'Diagnóstico & Trazabilidad de Stock'), {
      title: 'Diagnóstico de Stock',
    }),
  },
  {
    path: childPath(NAV.fixedAssetSupplies, '/inventories'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.fixedAssetSupplies, breadcrumb('Activo fijo', NAV.fixedAssetSupplies.title)),
  },
  {
    path: childPath(NAV.fixedAssetMachinery, '/inventories'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.fixedAssetMachinery, breadcrumb('Activo fijo', NAV.fixedAssetMachinery.title)),
  },
  {
    path: childPath(NAV.fixedAssetVehicles, '/inventories'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.fixedAssetVehicles, breadcrumb('Activo fijo', NAV.fixedAssetVehicles.title)),
  },
  {
    path: childPath(NAV.fixedAssetFurniture, '/inventories'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.fixedAssetFurniture, breadcrumb('Activo fijo', NAV.fixedAssetFurniture.title)),
  },
  { path: '**', redirectTo: childPath(NAV.products, '/inventories') },
];

@NgModule({
  imports: [RouterModule.forChild(INVENTORY_ROUTES)],
  exports: [RouterModule]
})
export class InventoriesRoutingModule { }
