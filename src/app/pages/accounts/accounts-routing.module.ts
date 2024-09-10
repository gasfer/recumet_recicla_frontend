import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsReceivableComponent } from './accounts-receivable/accounts-receivable.component';
import { AccountsPayableComponent } from './accounts-payable/accounts-payable.component';

const routes: Routes = [
  { path: 'accounts-payable', component: AccountsPayableComponent, 
    data: { data: [ { title: 'Adm. Caja' },{ title: 'Cuentas' },{ title: 'Cuentas por pagar' , active: true }], name: 'CUENTAS POR PAGAR'}},
  { path: 'accounts-receivable', component: AccountsReceivableComponent, 
    data: { data: [ { title: 'Adm. Caja' },{ title: 'Cuentas' },{ title: 'Cuentas por cobrar' , active: true }], name: 'CUENTAS POR COBRAR'}},
  { path: '**', redirectTo: 'accounts-payable'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }
