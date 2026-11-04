import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
export const ASSET_ROUTES: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(ASSET_ROUTES)],
  exports: [RouterModule],
})
export class AssetsRoutingModule {}
