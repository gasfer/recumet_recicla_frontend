import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeatureInDevelopmentComponent } from 'src/app/core/components/feature-in-development/feature-in-development.component';
import {
  NAVIGATION_DESTINATIONS as NAV,
  childPath,
  routeData,
} from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [
  { title: 'Entradas' },
  { title: 'Proveedores' },
  { title, active: true },
];

export const PROVIDER_WORKFLOW_ROUTES: Routes = [
  {
    path: childPath(NAV.providerPickup, '/providers'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.providerPickup, breadcrumb(NAV.providerPickup.title)),
  },
  {
    path: childPath(NAV.providerCertification, '/providers'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.providerCertification, breadcrumb(NAV.providerCertification.title)),
  },
  {
    path: childPath(NAV.providerAccounts, '/providers'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.providerAccounts, breadcrumb(NAV.providerAccounts.title)),
  },
  {
    path: childPath(NAV.providerPurchases, '/providers'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.providerPurchases, breadcrumb(NAV.providerPurchases.title)),
  },
  { path: '', redirectTo: childPath(NAV.providerPickup, '/providers'), pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(PROVIDER_WORKFLOW_ROUTES)],
  exports: [RouterModule],
})
export class ProvidersRoutingModule {}
