import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
export const PROVIDER_WORKFLOW_ROUTES: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(PROVIDER_WORKFLOW_ROUTES)],
  exports: [RouterModule],
})
export class ProvidersRoutingModule {}
