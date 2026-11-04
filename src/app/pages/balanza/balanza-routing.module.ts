import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BalanzaCamioneraComponent } from './balanza-camionera/balanza-camionera.component';
import { BalanzaManualComponent }    from './balanza-manual/balanza-manual.component';
import { ServicioBalanzaComponent }  from './servicio-balanza/servicio-balanza.component';
import {
  NAVIGATION_DESTINATIONS as NAV,
  childPath,
  routeData,
} from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (section: string, title: string) => [
  { title: 'Balanza' },
  { title: section },
  { title, active: true },
];

export const BALANZA_ROUTES: Routes = [
  {
    path: childPath(NAV.truckScaleRegister, '/scale'),
    component: BalanzaCamioneraComponent,
    data: routeData(NAV.truckScaleRegister, breadcrumb('Balanza camionera', NAV.truckScaleRegister.title)),
  },
  {
    path: childPath(NAV.truckScaleQuery, '/scale'),
    component: BalanzaCamioneraComponent,
    data: routeData(NAV.truckScaleQuery, breadcrumb('Balanza camionera', NAV.truckScaleQuery.title)),
  },
  {
    path: childPath(NAV.manualScaleRegister, '/scale'),
    component: BalanzaManualComponent,
    data: routeData(NAV.manualScaleRegister, breadcrumb('Balanza manual', NAV.manualScaleRegister.title)),
  },
  {
    path: childPath(NAV.manualScaleQuery, '/scale'),
    component: BalanzaManualComponent,
    data: routeData(NAV.manualScaleQuery, breadcrumb('Balanza manual', NAV.manualScaleQuery.title)),
  },
  {
    path: childPath(NAV.scaleServiceRegister, '/scale'),
    component: ServicioBalanzaComponent,
    data: routeData(NAV.scaleServiceRegister, breadcrumb('Servicio de balanza', NAV.scaleServiceRegister.title)),
  },
  {
    path: childPath(NAV.scaleServiceQuery, '/scale'),
    component: ServicioBalanzaComponent,
    data: routeData(NAV.scaleServiceQuery, breadcrumb('Servicio de balanza', NAV.scaleServiceQuery.title)),
  },
  { path: 'balanza-camionera', redirectTo: childPath(NAV.truckScaleRegister, '/scale'), pathMatch: 'full' },
  { path: 'balanza-manual', redirectTo: childPath(NAV.manualScaleRegister, '/scale'), pathMatch: 'full' },
  { path: 'servicio-balanza', redirectTo: childPath(NAV.scaleServiceRegister, '/scale'), pathMatch: 'full' },
  { path: '', redirectTo: childPath(NAV.truckScaleQuery, '/scale'), pathMatch: 'full' },
  { path: '**', redirectTo: childPath(NAV.truckScaleQuery, '/scale') },
];

@NgModule({
  imports: [RouterModule.forChild(BALANZA_ROUTES)],
  exports: [RouterModule],
})
export class BalanzaRoutingModule {}
