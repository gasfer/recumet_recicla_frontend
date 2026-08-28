import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CoreModule } from 'src/app/core/core.module';
import { ProvidersRoutingModule } from './providers-routing.module';

@NgModule({
  imports: [CommonModule, CoreModule, ProvidersRoutingModule],
})
export class ProvidersModule {}
