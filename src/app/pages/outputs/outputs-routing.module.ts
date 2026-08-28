import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientsComponent } from './clients/clients.component';
import { OutputComponent } from './output/output.component';
import { QueryOutputsComponent } from './query-outputs/query-outputs.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [{ title: 'Salidas' }, { title: 'Ventas' }, { title, active: true }];

export const OUTPUT_ROUTES: Routes = [
  { path: childPath(NAV.clients, '/outputs'), component: ClientsComponent,
    data: routeData(NAV.clients, breadcrumb(NAV.clients.title)) },
  { path: childPath(NAV.createSale, '/outputs'), component: OutputComponent,
    data: routeData(NAV.createSale, breadcrumb(NAV.createSale.title)) },
  { path: childPath(NAV.querySales, '/outputs'), component: QueryOutputsComponent,
    data: routeData(NAV.querySales, breadcrumb(NAV.querySales.title)) },
  { path: '**', redirectTo: 'clients'},
];

@NgModule({
  imports: [RouterModule.forChild(OUTPUT_ROUTES)],
  exports: [RouterModule]
})
export class OutputsRoutingModule { }
