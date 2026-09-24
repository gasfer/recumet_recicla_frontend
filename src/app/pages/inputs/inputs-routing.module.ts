import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProvidersComponent } from './providers/providers.component';
import { InputSmallComponent } from './input-small/input-small.component';
import { QueryInputsComponent } from './query-inputs/query-inputs.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [{ title: 'Entradas' }, { title: 'Compras' }, { title, active: true }];

export const INPUT_ROUTES: Routes = [
  { path: childPath(NAV.providers, '/inputs'), component: ProvidersComponent,
    data: routeData(NAV.providers, breadcrumb(NAV.providers.title)) },
  { path: childPath(NAV.createPurchase, '/inputs'), component: InputSmallComponent,
    data: routeData(NAV.createPurchase, breadcrumb(NAV.createPurchase.title)) },
  { path: childPath(NAV.queryPurchases, '/inputs'), component: QueryInputsComponent,
    data: routeData(NAV.queryPurchases, breadcrumb(NAV.queryPurchases.title)) },
  { path: childPath(NAV.purchaseReport, '/inputs'), component: PurchaseReportComponent,
    data: routeData(NAV.purchaseReport, breadcrumb(NAV.purchaseReport.title)) },
  { path: '**', redirectTo: 'providers'},

];

@NgModule({
  imports: [RouterModule.forChild(INPUT_ROUTES)],
  exports: [RouterModule]
})
export class InputsRoutingModule { }
