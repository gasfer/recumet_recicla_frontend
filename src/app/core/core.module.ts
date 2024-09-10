import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './components/table/table.component';
import { TableLoadingComponent } from './components/table-loading/table-loading.component';
import { CardEmptyComponent } from './components/card-empty/card-empty.component';
import { AlertNotifyComponent } from './components/alert-notify/alert-notify.component';

import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { LoadingComponent } from './components/loading/loading.component';
import { PipesModule } from './pipes/pipes.module';
import { ViewImageComponent } from './components/view-image/view-image.component';
import { DialogModule } from 'primeng/dialog';
import { InputSearchComponent } from './components/input-search/input-search.component';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DataviewProductsComponent } from './components/dataview-products/dataview-products.component';
import { BadgeModule } from 'primeng/badge';
import { ModalUpdateBsSusComponent } from './components/modal-update-bs-sus/modal-update-bs-sus.component';
@NgModule({
  declarations: [
    TableComponent,
    TableLoadingComponent,
    CardEmptyComponent,
    AlertNotifyComponent,
    LoadingComponent,
    ViewImageComponent,
    InputSearchComponent,
    DataviewProductsComponent,
    ModalUpdateBsSusComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    TooltipModule,
    TagModule,
    PaginatorModule,
    OverlayPanelModule,
    ReactiveFormsModule,
    ButtonModule,
    SkeletonModule,
    InputTextModule,
    PipesModule,
    DialogModule,
    KeyFilterModule,
    ScrollPanelModule,
    BadgeModule
  ],
  exports: [
    TableComponent,
    CardEmptyComponent,
    AlertNotifyComponent,
    LoadingComponent,
    InputSearchComponent,
    DataviewProductsComponent,
    ModalUpdateBsSusComponent
  ]
})
export class CoreModule { }
