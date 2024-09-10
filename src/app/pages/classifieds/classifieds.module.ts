import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClassifiedsRoutingModule } from './classifieds-routing.module';
import { QueryClassifiedsComponent } from './query-classifieds/query-classifieds.component';
import { ClassifiedComponent } from './classified/classified.component';
import { PagesModule } from '../pages.module';
import { ModalConfigClassifiedComponent } from './classified/components/modal-config-classified/modal-config-classified.component';
import { ModalSaveClassifiedComponent } from './classified/components/modal-save-classified/modal-save-classified.component';
import { TableClassifiedDetailsComponent } from './classified/components/table-classified-details/table-classified-details.component';
import { InventoriesModule } from '../inventories/inventories.module';
import { ModalViewDetailsComponent } from './query-classifieds/components/modal-view-details/modal-view-details.component';


@NgModule({
  declarations: [
    QueryClassifiedsComponent,
    ClassifiedComponent,
    ModalConfigClassifiedComponent,
    ModalSaveClassifiedComponent,
    TableClassifiedDetailsComponent,
    ModalViewDetailsComponent
  ],
  imports: [
    CommonModule,
    ClassifiedsRoutingModule,
    PagesModule,
    InventoriesModule
  ]
})
export class ClassifiedsModule { }
