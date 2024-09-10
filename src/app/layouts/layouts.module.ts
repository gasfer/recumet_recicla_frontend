import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { FooterComponent } from './footer/footer.component';
import { HorizontalComponent } from './horizontal/horizontal.component';
import { HorizontaltopbarComponent } from './horizontaltopbar/horizontaltopbar.component';
import { RightsidebarComponent } from './rightsidebar/rightsidebar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { VerticalComponent } from './vertical/vertical.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { SimplebarAngularModule } from 'simplebar-angular';
import { LanguageService } from '../core/services/language.service';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { DropdownModule } from 'primeng/dropdown';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    LayoutComponent,
    FooterComponent,
    HorizontalComponent,
    HorizontaltopbarComponent,
    RightsidebarComponent,
    SidebarComponent,
    TopbarComponent,
    VerticalComponent,
    BreadcrumbComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    RouterModule,
    BsDropdownModule.forRoot(),
    SimplebarAngularModule,
    DropdownModule
  ],
  exports: [],
  providers: [LanguageService]
})
export class LayoutsModule { }
