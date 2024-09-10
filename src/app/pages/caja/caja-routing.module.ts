import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdmCajaComponent } from './adm-caja/adm-caja.component';
import { QueryCajaComponent } from './query-caja/query-caja.component';

const routes: Routes = [
  { path: 'adm-caja', component: AdmCajaComponent, 
    data: { data: [  { title: 'Adm. Caja' },{ title: 'Caja' },{ title: 'Adm Caja - Movimientos de Caja', active: true }], name:'CAJA', action:'create'}},
  { path: 'query-caja', component: QueryCajaComponent, 
    data: { data: [  { title: 'Adm. Caja' },{ title: 'Caja' },{ title: 'Consultas Caja', active: true }], name:'CAJA'}},
  { path: '**', redirectTo: 'adm-caja'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CajaRoutingModule { }
