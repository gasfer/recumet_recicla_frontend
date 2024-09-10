import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsPayableComponent } from './accounts-payable/accounts-payable.component';
import { AccountsReceivableComponent } from './accounts-receivable/accounts-receivable.component';
import { PagesModule } from '../pages.module';
import { ModalViewAbonosAccountPayableComponent } from './accounts-payable/components/modal-view-abonos-account-payable/modal-view-abonos-account-payable.component';
import { ModalNewAbonoAccountPayableComponent } from './accounts-payable/components/modal-new-abono-account-payable/modal-new-abono-account-payable.component';
import { ModalNewAbonoAccountReceivableComponent } from './accounts-receivable/components/modal-new-abono-account-receivable/modal-new-abono-account-receivable.component';
import { ModalViewAbonosAccountReceivableComponent } from './accounts-receivable/components/modal-view-abonos-account-receivable/modal-view-abonos-account-receivable.component';


@NgModule({
  declarations: [
    AccountsPayableComponent,
    AccountsReceivableComponent,
    ModalViewAbonosAccountPayableComponent,
    ModalNewAbonoAccountPayableComponent,
    ModalNewAbonoAccountReceivableComponent,
    ModalViewAbonosAccountReceivableComponent,
  ],
  imports: [
    CommonModule,
    AccountsRoutingModule,
    PagesModule
  ]
})
export class AccountsModule { }
