import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeatureInDevelopmentComponent } from 'src/app/core/components/feature-in-development/feature-in-development.component';
import {
  NAVIGATION_DESTINATIONS as NAV,
  childPath,
  routeData,
} from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (section: string, title: string) => [
  { title: 'Adm. Caja' },
  { title: section },
  { title, active: true },
];

export const ASSET_ROUTES: Routes = [
  {
    path: childPath(NAV.assetPurchaseRequest, '/assets'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.assetPurchaseRequest, breadcrumb('Ingreso activos', NAV.assetPurchaseRequest.title)),
  },
  {
    path: childPath(NAV.assetPurchaseOrder, '/assets'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.assetPurchaseOrder, breadcrumb('Ingreso activos', NAV.assetPurchaseOrder.title)),
  },
  {
    path: childPath(NAV.assetPurchaseManagement, '/assets'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.assetPurchaseManagement, breadcrumb('Ingreso activos', NAV.assetPurchaseManagement.title)),
  },
  {
    path: childPath(NAV.assetConsumables, '/assets'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.assetConsumables, breadcrumb('Salida activos', NAV.assetConsumables.title)),
  },
  {
    path: childPath(NAV.assetTools, '/assets'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.assetTools, breadcrumb('Salida activos', NAV.assetTools.title)),
  },
  {
    path: childPath(NAV.assetOutputManagement, '/assets'),
    component: FeatureInDevelopmentComponent,
    data: routeData(NAV.assetOutputManagement, breadcrumb('Salida activos', NAV.assetOutputManagement.title)),
  },
  { path: '', redirectTo: childPath(NAV.assetPurchaseRequest, '/assets'), pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(ASSET_ROUTES)],
  exports: [RouterModule],
})
export class AssetsRoutingModule {}
