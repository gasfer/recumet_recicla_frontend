import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdmCajaComponent } from './adm-caja/adm-caja.component';
import { QueryCajaComponent } from './query-caja/query-caja.component';
import { FeatureInDevelopmentComponent } from 'src/app/core/components/feature-in-development/feature-in-development.component';
import {
  NAVIGATION_DESTINATIONS as NAV,
  childPath,
  routeData,
} from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [
  { title: 'Adm. Caja' },
  { title: 'Caja' },
  { title, active: true },
];

export const CAJA_ROUTES: Routes = [
  {
    path: childPath(NAV.cashDashboard, '/caja'),
    component: AdmCajaComponent,
    data: routeData(NAV.cashDashboard, breadcrumb('Adm Caja - Movimientos de Caja')),
  },
  {
    path: childPath(NAV.cashQuery, '/caja'),
    component: QueryCajaComponent,
    data: routeData(NAV.cashQuery, breadcrumb('Consultas Caja')),
  },
  {
    path: childPath(NAV.cashExpenses, '/caja'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.cashExpenses, breadcrumb(NAV.cashExpenses.title)),
  },
  {
    path: childPath(NAV.cashMajorTransfers, '/caja'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.cashMajorTransfers, breadcrumb(NAV.cashMajorTransfers.title)),
  },
  { path: '**', redirectTo: 'adm-caja'},
];

@NgModule({
  imports: [RouterModule.forChild(CAJA_ROUTES)],
  exports: [RouterModule]
})
export class CajaRoutingModule { }
