import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BalanzaCamioneraComponent } from './balanza-camionera/balanza-camionera.component';
import { BalanzaManualComponent }    from './balanza-manual/balanza-manual.component';
import { ServicioBalanzaComponent }  from './servicio-balanza/servicio-balanza.component';
import { FeatureInDevelopmentComponent } from 'src/app/core/components/feature-in-development/feature-in-development.component';
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
  {
    path: childPath(NAV.driverRegister, '/scale'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.driverRegister, breadcrumb('Transportistas', NAV.driverRegister.title)),
  },
  {
    path: childPath(NAV.driverQuery, '/scale'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.driverQuery, breadcrumb('Transportistas', NAV.driverQuery.title)),
  },
  {
    path: childPath(NAV.truckRegister, '/scale'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.truckRegister, breadcrumb('Camiones', NAV.truckRegister.title)),
  },
  {
    path: childPath(NAV.truckQuery, '/scale'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.truckQuery, breadcrumb('Camiones', NAV.truckQuery.title)),
  },
  { path: 'balanza-camionera', redirectTo: childPath(NAV.truckScaleRegister, '/scale'), pathMatch: 'full' },
  { path: 'balanza-manual', redirectTo: childPath(NAV.manualScaleRegister, '/scale'), pathMatch: 'full' },
  { path: 'servicio-balanza', redirectTo: childPath(NAV.scaleServiceRegister, '/scale'), pathMatch: 'full' },
  { path: '', redirectTo: childPath(NAV.truckScaleRegister, '/scale'), pathMatch: 'full' },
  { path: '**', redirectTo: childPath(NAV.truckScaleRegister, '/scale') },
];

@NgModule({
  imports: [RouterModule.forChild(BALANZA_ROUTES)],
  exports: [RouterModule],
})
export class BalanzaRoutingModule {}
