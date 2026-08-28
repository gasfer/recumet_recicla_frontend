import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CoreModule } from 'src/app/core/core.module';
import { AssetsRoutingModule } from './assets-routing.module';

@NgModule({
  imports: [CommonModule, CoreModule, AssetsRoutingModule],
})
export class AssetsModule {}
