import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TransfersRoutingModule } from './transfers-routing.module';
import { TransferComponent } from './transfer/transfer.component';
import { QueryTransfersComponent } from './query-transfers/query-transfers.component';
import { QueryReceptionsComponent } from './query-receptions/query-receptions.component';
import { PagesModule } from '../pages.module';
import { ModalViewDetailsComponent } from './components/modal-view-details/modal-view-details.component';
import { ModalConfigTransferComponent } from './transfer/components/modal-config-transfer/modal-config-transfer.component';
import { ModalSaveTransferComponent } from './transfer/components/modal-save-transfer/modal-save-transfer.component';
import { TableTransferDetailsComponent } from './transfer/components/table-transfer-details/table-transfer-details.component';
import { ModalApprovedTransferComponent } from './query-receptions/components/modal-approved-transfer/modal-approved-transfer.component';


@NgModule({
  declarations: [
    TransferComponent,
    QueryTransfersComponent,
    QueryReceptionsComponent,
    ModalViewDetailsComponent,
    ModalConfigTransferComponent,
    ModalSaveTransferComponent,
    TableTransferDetailsComponent,
    ModalApprovedTransferComponent
  ],
  imports: [
    CommonModule,
    TransfersRoutingModule,
    PagesModule
  ]
})
export class TransfersModule { }
