import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProvidersComponent } from './providers/providers.component';
import { InputSmallComponent } from './input-small/input-small.component';
import { QueryInputsComponent } from './query-inputs/query-inputs.component';

const routes: Routes = [
  { path: 'providers', component: ProvidersComponent, 
    data: { data: [ { title: 'Entradas' },{ title: 'Compras' },{ title: 'Proveedores' , active: true }], name:'PROVEEDORES'}},
  { path: 'input-small', component: InputSmallComponent, 
    data: { data: [ { title: 'Entradas' },{ title: 'Compras' },{ title: 'Realizar Compras' , active: true }],name:'COMPRAS', action:'create'}},
  { path: 'query-inputs', component: QueryInputsComponent, 
    data: { data: [ { title: 'Entradas' },{ title: 'Compras' },{ title: 'Consultar Compras' , active: true }],name:'COMPRAS', action:'view'}},
  { path: '**', redirectTo: 'providers'},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InputsRoutingModule { }
