import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { OutputComponent } from './output/output.component';
import { QueryOutputsComponent } from './query-outputs/query-outputs.component';

const routes: Routes = [
  { path: 'clients', component: ClientsComponent, 
    data: { data: [ { title: 'Salidas' },{ title: 'Ventas' },{ title: 'Clientes' , active: true }], name:'CLIENTES'}},
  { path: 'output', component: OutputComponent, 
    data: { data: [ { title: 'Salidas' },{ title: 'Ventas' },{ title: 'Realizar Ventas' , active: true }], name:'VENTAS',action:'create'}},
  { path: 'query-outputs', component: QueryOutputsComponent, 
    data: { data: [ { title: 'Salidas' },{ title: 'Ventas' },{ title: 'Consultar Ventas' , active: true }], name:'VENTAS',action:'view'}},
  { path: '**', redirectTo: 'clients'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OutputsRoutingModule { }
