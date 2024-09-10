import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManagementsRoutingModule } from './managements-routing.module';
import { CompanyComponent } from './company/company.component';
import { UsersComponent } from './users/users.component';
import { StoragesComponent } from './storages/storages.component';
import { PagesModule } from '../pages.module';
import { ModalUserComponent } from './users/components/modal-user/modal-user.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { ModalSucursalComponent } from './sucursales/components/modal-sucursal/modal-sucursal.component';
import { ModalAssignSucursalesComponent } from './users/components/modal-assign-sucursales/modal-assign-sucursales.component';
import { ModalAssignPermissionsComponent } from './users/components/modal-assign-permissions/modal-assign-permissions.component';
import { ModalAssignShiftsComponent } from './users/components/modal-assign-shifts/modal-assign-shifts.component';
import { ModalCompanyComponent } from './company/components/modal-company/modal-company.component';
import { ModalStorageComponent } from './storages/components/modal-storage/modal-storage.component';
import { TrasportCompanyComponent } from './trasport-company/trasport-company.component';
import { ModalTrasportCompanyComponent } from './trasport-company/components/modal-trasport-company/modal-trasport-company.component';
import { ModalChauffeursComponent } from './trasport-company/components/modal-chauffeurs/modal-chauffeurs.component';
import { ModalNewChauffeurComponent } from './trasport-company/components/modal-new-chauffeur/modal-new-chauffeur.component';
import { ModalNewCargoTrucksComponent } from './trasport-company/components/modal-new-cargo-trucks/modal-new-cargo-trucks.component';
import { ModalCargoTrucksComponent } from './trasport-company/components/modal-cargo-trucks/modal-cargo-trucks.component';

@NgModule({
  declarations: [
    CompanyComponent,
    UsersComponent,
    StoragesComponent,
    ModalUserComponent,
    SucursalesComponent,
    ModalSucursalComponent,
    ModalAssignSucursalesComponent,
    ModalAssignPermissionsComponent,
    ModalAssignShiftsComponent,
    ModalCompanyComponent,
    ModalStorageComponent,
    TrasportCompanyComponent,
    ModalTrasportCompanyComponent,
    ModalChauffeursComponent,
    ModalNewChauffeurComponent,
    ModalNewCargoTrucksComponent,
    ModalCargoTrucksComponent,
  ],
  imports: [
    CommonModule,
    ManagementsRoutingModule,
    PagesModule
  ]
})
export class ManagementsModule { }
