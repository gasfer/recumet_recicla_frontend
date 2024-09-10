import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'dashboard' ,loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule) },
  { path: 'inputs', loadChildren: () => import('./inputs/inputs.module').then(m => m.InputsModule) },
  { path: 'outputs', loadChildren: () => import('./outputs/outputs.module').then(m => m.OutputsModule) },
  { path: 'classifieds', loadChildren: () => import('./classifieds/classifieds.module').then(m => m.ClassifiedsModule) },
  { path: 'transfers', loadChildren: () => import('./transfers/transfers.module').then(m => m.TransfersModule) },
  { path: 'inventories',loadChildren: () => import('./inventories/inventories.module').then(m => m.InventoriesModule) },
  { path: 'managements',loadChildren: () => import('./managements/managements.module').then(m => m.ManagementsModule) },
  { path: 'accounts',loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule) },
  { path: 'caja',loadChildren: () => import('./caja/caja.module').then(m => m.CajaModule) },
  { path: '**', redirectTo: 'dashboard'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule { }
