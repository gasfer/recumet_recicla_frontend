import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CajaRoutingModule } from './caja-routing.module';
import { AdmCajaComponent } from './adm-caja/adm-caja.component';
import { QueryCajaComponent } from './query-caja/query-caja.component';
import { PagesModule } from '../pages.module';
import { ChartModule } from 'primeng/chart';
import { ModalOpenCloseEditAperturaCajaComponent } from './adm-caja/components/modal-open-close-edit-apertura-caja/modal-open-close-edit-apertura-caja.component';
import { ModalNewDetailCajaComponent } from './adm-caja/components/modal-new-detail-caja/modal-new-detail-caja.component';
import { SelectButtonModule }  from 'primeng/selectbutton';
import { AvatarModule }        from 'primeng/avatar';
import { DividerModule }       from 'primeng/divider';
import { FileUploadModule }    from 'primeng/fileupload';
import { InputTextareaModule } from 'primeng/inputtextarea';

@NgModule({
  declarations: [
    AdmCajaComponent,
    QueryCajaComponent,
    ModalOpenCloseEditAperturaCajaComponent,
    ModalNewDetailCajaComponent,
  ],
  imports: [
    CommonModule,
    CajaRoutingModule,
    PagesModule,
    ChartModule,
    SelectButtonModule,
    AvatarModule,
    DividerModule,
    FileUploadModule,
    InputTextareaModule,
  ]
})
export class CajaModule { }
