import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PagesRoutingModule } from './pages-routing.module';
import { CoreModule } from 'src/app/core/core.module';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { TabMenuModule } from 'primeng/tabmenu';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { KeyFilterModule } from 'primeng/keyfilter';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessagesModule } from 'primeng/messages';
import { BadgeModule } from 'primeng/badge';
import { CalendarModule } from 'primeng/calendar';
import { SplitButtonModule } from 'primeng/splitbutton';
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
  ],
  exports: [
    ReactiveFormsModule,
    CoreModule,
    FormsModule,
    ToolbarModule,
    ButtonModule,
    TabMenuModule,
    DialogModule,
    TagModule,
    KeyFilterModule,
    InputTextModule,
    InputSwitchModule,
    PasswordModule,
    DropdownModule,
    TableModule,
    RadioButtonModule,
    CheckboxModule,
    InputNumberModule,
    MessagesModule,
    BadgeModule,
    CalendarModule,
    SplitButtonModule
  ]
})
export class PagesModule { }
