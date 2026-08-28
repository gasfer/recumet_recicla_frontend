import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyComponent } from './company/company.component';
import { StoragesComponent } from './storages/storages.component';
import { UsersComponent } from './users/users.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { TrasportCompanyComponent } from './trasport-company/trasport-company.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [{ title: 'Administración' }, { title: 'Gestión' }, { title, active: true }];

export const MANAGEMENT_ROUTES: Routes = [
  { path: childPath(NAV.company, '/managements'), component: CompanyComponent,
    data: routeData(NAV.company, breadcrumb(NAV.company.title)) },
  { path: childPath(NAV.branches, '/managements'), component: SucursalesComponent,
    data: routeData(NAV.branches, breadcrumb(NAV.branches.title)) },
  { path: childPath(NAV.storages, '/managements'), component: StoragesComponent,
    data: routeData(NAV.storages, breadcrumb(NAV.storages.title)) },
  { path: childPath(NAV.users, '/managements'), component: UsersComponent,
    data: routeData(NAV.users, breadcrumb(NAV.users.title)) },
  { path: childPath(NAV.transportCompanies, '/managements'), component: TrasportCompanyComponent,
    data: routeData(NAV.transportCompanies, breadcrumb(NAV.transportCompanies.title)) },
  { path: '**', redirectTo: 'company' }
];

@NgModule({
  imports: [RouterModule.forChild(MANAGEMENT_ROUTES)],
  exports: [RouterModule]
})
export class ManagementsRoutingModule { }
