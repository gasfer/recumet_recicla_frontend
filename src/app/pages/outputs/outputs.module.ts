import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OutputsRoutingModule } from './outputs-routing.module';
import { ClientsComponent } from './clients/clients.component';
import { OutputComponent } from './output/output.component';
import { QueryOutputsComponent } from './query-outputs/query-outputs.component';
import { PagesModule } from '../pages.module';
import { ModalClientComponent } from './clients/components/modal-client/modal-client.component';
import { ModalConfigOutputComponent } from './output/components/modal-config-output/modal-config-output.component';
import { ModalSaveOutputComponent } from './output/components/modal-save-output/modal-save-output.component';
import { TableOutputDetailsComponent } from './output/components/table-output-details/table-output-details.component';
import { ModalViewDetailsComponent } from './query-outputs/components/modal-view-details/modal-view-details.component';


@NgModule({
  declarations: [
    ClientsComponent,
    OutputComponent,
    QueryOutputsComponent,
    ModalClientComponent,
    ModalConfigOutputComponent,
    ModalSaveOutputComponent,
    TableOutputDetailsComponent,
    ModalViewDetailsComponent
  ],
  imports: [
    CommonModule,
    OutputsRoutingModule,
    PagesModule
  ]
})
export class OutputsModule { }
