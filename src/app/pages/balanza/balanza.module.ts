import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BalanzaRoutingModule } from './balanza-routing.module';

// ─────────────────────────────────────────────────────────────────────────────
// PrimeNG 17.18.x — rutas y nombres de módulos verificados
// Referencia: https://primeng.org/installation (v17)
// ─────────────────────────────────────────────────────────────────────────────

// Layout / Data
import { TableModule }          from 'primeng/table';           // p-table
import { AccordionModule }      from 'primeng/accordion';       // p-accordion

// Botones
import { ButtonModule }         from 'primeng/button';          // pButton
import { SelectButtonModule }   from 'primeng/selectbutton';    // p-selectButton
import { SplitButtonModule }    from 'primeng/splitbutton';     // p-splitButton (por si se usa)

// Inputs de texto
import { InputTextModule }      from 'primeng/inputtext';       // pInputText
import { InputTextareaModule }  from 'primeng/inputtextarea';   // pInputTextarea  ← NO 'TextareaModule'
import { InputNumberModule }    from 'primeng/inputnumber';     // p-inputNumber

// Selección
import { DropdownModule }       from 'primeng/dropdown';        // p-dropdown
import { CheckboxModule }       from 'primeng/checkbox';        // p-checkbox
import { RadioButtonModule }    from 'primeng/radiobutton';     // p-radioButton

// Fecha
import { CalendarModule }       from 'primeng/calendar';        // p-calendar

// Visualización
import { TagModule }            from 'primeng/tag';             // p-tag
import { BadgeModule }          from 'primeng/badge';           // pBadge
import { MessagesModule }       from 'primeng/messages';        // p-messages  ← incluye MessageModule
import { MessageModule }        from 'primeng/message';         // p-message (inline)
import { TooltipModule }        from 'primeng/tooltip';         // pTooltip
import { SkeletonModule }       from 'primeng/skeleton';        // p-skeleton (loading)
import { DividerModule }        from 'primeng/divider';         // p-divider

// Overlays / Popups
import { DialogModule }         from 'primeng/dialog';          // p-dialog
import { ToastModule }          from 'primeng/toast';           // p-toast       ← OBLIGATORIO aquí
import { ConfirmDialogModule }  from 'primeng/confirmdialog';   // p-confirmDialog ← OBLIGATORIO aquí

// Servicios PrimeNG — DEBEN estar en providers de ESTE módulo (lazy)
import { ConfirmationService, MessageService } from 'primeng/api';

// ─────────────────────────────────────────────────────────────────────────────
// Componentes del módulo
// ─────────────────────────────────────────────────────────────────────────────
import { BalanzaCamioneraComponent } from './balanza-camionera/balanza-camionera.component';
import { BalanzaManualComponent }    from './balanza-manual/balanza-manual.component';
import { ServicioBalanzaComponent }  from './servicio-balanza/servicio-balanza.component';
import { CoreModule } from 'src/app/core/core.module';

@NgModule({
  declarations: [
    BalanzaCamioneraComponent,
    BalanzaManualComponent,
    ServicioBalanzaComponent,
  ],
  imports: [
    // Angular
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BalanzaRoutingModule,
    CoreModule,

    // ── PrimeNG 17.18.x ─────────────────────────────────────────────────
    // Tabla
    TableModule,
    AccordionModule,
    // Botones
    ButtonModule,
    SelectButtonModule,
    SplitButtonModule,
    // Inputs
    InputTextModule,
    InputTextareaModule,      // ← pInputTextarea — usa esta, NO TextareaModule
    InputNumberModule,
    // Selección
    DropdownModule,
    CheckboxModule,
    RadioButtonModule,
    // Fecha
    CalendarModule,
    // Visualización
    TagModule,
    BadgeModule,
    MessagesModule,
    MessageModule,
    TooltipModule,
    SkeletonModule,
    DividerModule,
    // Overlays — estos deben estar SIEMPRE en el módulo donde se usan
    DialogModule,
    ToastModule,              // ← habilita <p-toast>
    ConfirmDialogModule,      // ← habilita <p-confirmDialog>
  ],

  // ── CRÍTICO para módulos lazy ──────────────────────────────────────────
  // Si estos servicios están solo en AppModule o CoreModule, los componentes
  // lazy NO los encuentran. Deben repetirse aquí.
  providers: [
    MessageService,           // requerido por p-toast
    ConfirmationService,      // requerido por p-confirmDialog
  ],
})
export class BalanzaModule {}
