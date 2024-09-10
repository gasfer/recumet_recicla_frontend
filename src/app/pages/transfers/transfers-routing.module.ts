import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransferComponent } from './transfer/transfer.component';
import { QueryTransfersComponent } from './query-transfers/query-transfers.component';
import { QueryReceptionsComponent } from './query-receptions/query-receptions.component';


const routes: Routes = [
  { path: 'transfer', component: TransferComponent, 
    data: { data: [ { title: 'Salidas' },{ title: 'Traslados' },{ title: 'Nuevo Traslado' , active: true }], name: 'TRASLADOS', action:'create'}},
  { path: 'query-transfers', component: QueryTransfersComponent, 
    data: { data: [ { title: 'Salidas' },{ title: 'Traslados' },{ title: 'Consultar Traslados' , active: true }],name: 'TRASLADOS', action:'view'}},
  { path: 'query-receptions', component: QueryReceptionsComponent, 
    data: { data: [ { title: 'Salidas' },{ title: 'Traslados' },{ title: 'Consultar Recepciones' , active: true }],name: 'RECEPCIONES', action:'view'}},
  { path: '**', redirectTo: 'transfer'},
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TransfersRoutingModule { }
