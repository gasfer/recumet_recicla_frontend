import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyComponent } from './company/company.component';
import { StoragesComponent } from './storages/storages.component';
import { UsersComponent } from './users/users.component';
import { SucursalesComponent } from './sucursales/sucursales.component';
import { TrasportCompanyComponent } from './trasport-company/trasport-company.component';

const routes: Routes = [
  { path: 'company', component: CompanyComponent,
    data: { data: [ { title: 'Administración' },{ title: 'Gestión' },{ title: 'Empresa' , active: true }],name:'EMPRESA', action:'view'} },
  { path: 'sucursales', component: SucursalesComponent, 
    data: { data: [ { title: 'Administración' },{ title: 'Gestión' },{ title: 'Sucursales' , active: true }],name:'SUCURSALES', action:'view'} },
  { path: 'storages', component: StoragesComponent, 
    data: { data: [ { title: 'Administración' },{ title: 'Gestión' },{ title: 'Almacenes' , active: true }],name:'ALMACENES', action:'view'} },
  { path: 'users',component: UsersComponent ,
    data: { data: [ { title: 'Administración' },{ title: 'Gestión'},{ title: 'Usuarios' , active: true }],name:'USUARIOS', action:'view'},  },
  { path: 'trasport_company',component: TrasportCompanyComponent ,
    data: { data: [ { title: 'Administración' },{ title: 'Gestión'},{ title: 'Compañías de trasporte' , active: true }],name:'COMP. TRASPORTE', action:'view'},  },
  { path: '**', redirectTo: 'company' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagementsRoutingModule { }
