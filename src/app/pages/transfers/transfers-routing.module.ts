import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransferComponent } from './transfer/transfer.component';
import { QueryTransfersComponent } from './query-transfers/query-transfers.component';
import { QueryReceptionsComponent } from './query-receptions/query-receptions.component';
import { ReconciliationsComponent } from './reconciliations/reconciliations.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';


const breadcrumb = (title: string) => [{ title: 'Salidas' }, { title: 'Traslados' }, { title, active: true }];

export const TRANSFER_ROUTES: Routes = [
  { path: childPath(NAV.createTransfer, '/transfers'), component: TransferComponent,
    data: routeData(NAV.createTransfer, breadcrumb(NAV.createTransfer.title)) },
  { path: childPath(NAV.queryTransfers, '/transfers'), component: QueryTransfersComponent,
    data: routeData(NAV.queryTransfers, breadcrumb(NAV.queryTransfers.title)) },
  { path: childPath(NAV.queryReceptions, '/transfers'), component: QueryReceptionsComponent,
    data: routeData(NAV.queryReceptions, breadcrumb(NAV.queryReceptions.title)) },
  { path: childPath(NAV.reconciliations, '/transfers'), component: ReconciliationsComponent,
    data: routeData(NAV.reconciliations, breadcrumb(NAV.reconciliations.title)) },
  { path: '**', redirectTo: 'transfer'},
];
@NgModule({
  imports: [RouterModule.forChild(TRANSFER_ROUTES)],
  exports: [RouterModule]
})
export class TransfersRoutingModule { }
