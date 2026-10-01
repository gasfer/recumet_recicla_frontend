import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './home/home.component';
import { CardHomeComponent } from './components/card-home/card-home.component';
import { NgxTypedJsModule } from 'ngx-typed-js';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    HomeComponent,
    CardHomeComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    NgxTypedJsModule,
    FormsModule,
    CoreModule
  ]
})
export class DashboardModule { }
