import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: childPath(NAV.dashboard, '/dashboard'), component: HomeComponent,
    data: routeData(NAV.dashboard, [{ title: 'Dashboard' }, { title: 'Home', active: true }], { name: 'INIT' })
  },
  {
    path: '**', redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forChild(DASHBOARD_ROUTES)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
