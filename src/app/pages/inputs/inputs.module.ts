import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InputsRoutingModule } from './inputs-routing.module';
import { ProvidersComponent } from './providers/providers.component';
import { InputSmallComponent } from './input-small/input-small.component';
import { ModalProviderComponent } from './providers/components/modal-provider/modal-provider.component';
import { PagesModule } from '../pages.module';
import { ModalSectorsComponent } from './providers/components/modal-sectors/modal-sectors.component';
import { ModalNewSectorComponent } from './providers/components/modal-new-sector/modal-new-sector.component';
import { TableInputDetailsComponent } from './input-small/components/table-input-details/table-input-details.component';
import { CoreModule } from 'src/app/core/core.module';
import { ModalConfigInputComponent } from './input-small/components/modal-config-input/modal-config-input.component';
import { ModalSaveInputComponent } from './input-small/components/modal-save-input/modal-save-input.component';
import { QueryInputsComponent } from './query-inputs/query-inputs.component';
import { ModalViewDetailsComponent } from './query-inputs/components/modal-view-details/modal-view-details.component';
import { ChipModule } from 'primeng/chip';
@NgModule({
  declarations: [
    ProvidersComponent,
    InputSmallComponent,
    ModalProviderComponent,
    ModalSectorsComponent,
    ModalNewSectorComponent,
    TableInputDetailsComponent,
    ModalConfigInputComponent,
    ModalSaveInputComponent,
    QueryInputsComponent,
    ModalViewDetailsComponent,
  ],
  imports: [
    CommonModule, 
    InputsRoutingModule,
    PagesModule,
    CoreModule,
    ChipModule
  ],
})
export class InputsModule {}
