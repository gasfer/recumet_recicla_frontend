import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './home/home.component';
import { CardHomeComponent } from './components/card-home/card-home.component';
import { NgxTypedJsModule } from 'ngx-typed-js';
import { CoreModule } from 'src/app/core/core.module';


@NgModule({
  declarations: [
    HomeComponent,
    CardHomeComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    NgxTypedJsModule,
    CoreModule
  ]
})
export class DashboardModule { }
