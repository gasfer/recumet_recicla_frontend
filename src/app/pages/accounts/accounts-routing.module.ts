import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsReceivableComponent } from './accounts-receivable/accounts-receivable.component';
import { AccountsPayableComponent } from './accounts-payable/accounts-payable.component';
import { NAVIGATION_DESTINATIONS as NAV, childPath, routeData } from 'src/app/core/constants/application-navigation.constants';

const breadcrumb = (title: string) => [{ title: 'Adm. Caja' }, { title: 'Cuentas' }, { title, active: true }];

export const ACCOUNT_ROUTES: Routes = [
  { path: childPath(NAV.accountsPayable, '/accounts'), component: AccountsPayableComponent,
    data: routeData(NAV.accountsPayable, breadcrumb(NAV.accountsPayable.title)) },
  { path: childPath(NAV.accountsReceivable, '/accounts'), component: AccountsReceivableComponent,
    data: routeData(NAV.accountsReceivable, breadcrumb(NAV.accountsReceivable.title)) },
  { path: '**', redirectTo: 'accounts-payable'},
];

@NgModule({
  imports: [RouterModule.forChild(ACCOUNT_ROUTES)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }
