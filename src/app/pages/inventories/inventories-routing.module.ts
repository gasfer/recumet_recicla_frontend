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

const routes: Routes = [
  { path: 'products', component: ProductsComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Productos' , active: true }], name: 'PRODUCTOS'} },
  { path: 'categories', component: CategoriesComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Categorías' , active: true }], name: 'CATEGORIAS'}},
  { path: 'units', component: UnitsComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Unidad de medida' , active: true }], name: 'UND MEDIDA'}},
  { path: 'scales', component: ScalesComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Balanzas' , active: true }], name: 'BALANZAS'}},
  { path: 'kardex', component: KardexComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Kardex' , active: true }], name: 'KARDEX'}},

  // 📊 KARDEX FÍSICO - Rutas ESPECÍFICAS primero (más específicas)
  {
    path: 'kardex-fisico/mp',
    component: KardexFisicoComponent,
    data: {
      categoryIds: [1, 2, 5, 13, 8, 6, 7],
      title: '(MP) Materia Prima'
    }
  },
  {
    path: 'kardex-fisico/pt',
    component: KardexFisicoComponent,
    data: {
      categoryIds: [4],
      title: '(PT) Productos Terminados'
    }
  },
  {
    path: 'kardex-fisico/all',
    component: KardexFisicoComponent,
    data: {
      categoryIds: [],
      title: 'Todos los Productos'
    }
  },
  {
  path: 'kardex-fisico/ar',
  component: KardexFisicoComponent,
  data: {
    categoryIds: [14],
    title: '(AR) Artículos de Reventa'
  }
},
  // 📊 KARDEX FÍSICO - Ruta GENERAL después (menos específica)
  {
    path: 'kardex-fisico',
    redirectTo: 'kardex-fisico/all',
    pathMatch: 'full'
  },

  { path: 'kardex-existencia', component: KardexExistenciaComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Kardex De Existencia' , active: true }], name: 'KARDEX'}},
  { path: 'list-products-prices', component: ListCostsProductComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Almacén' },{ title: 'Productos' }, { title: 'Listado de precios' , active: true }], name: 'LISTADO DE PRECIOS'}},

  // 🎯 Ruta wildcard siempre al FINAL
  { path: '**', redirectTo: 'products'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoriesRoutingModule { }
