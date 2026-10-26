import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-provider-contacts-section',
  template: `
    <div class="mt-3 border-t border-blue-100 pt-2">
      <div class="flex items-center justify-between mb-2">
        <b class="text-xs text-blue-900">{{ commercial ? 'Contactos comerciales' : 'Contactos registrados por sede' }}</b>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="add.emit()"><i class="fa-solid fa-plus"></i> Contacto</button>
      </div>
      <div *ngFor="let contact of contacts.controls; let i = index" [formGroup]="asGroup(contact)" class="provider-contact-card mb-2 p-2 bg-white rounded border border-blue-100">
        <div class="provider-contact-identity">
          <div class="erp-field"><label class="erp-label required">{{ commercial ? 'Nombre persona de contacto' : 'Nombre completo' }}</label><input pInputText formControlName="full_name" class="erp-input w-full"><small *ngIf="contact.get('full_name')?.invalid && contact.get('full_name')?.touched" class="erp-error-msg">El nombre del contacto es obligatorio.</small></div>
        </div>
        <div class="provider-contact-details">
          <div class="erp-field"><label class="erp-label" [class.required]="requireDetails">{{ commercial ? 'Celular persona de contacto' : 'Celular' }}</label><input pInputText formControlName="cellphone" class="erp-input w-full"><small *ngIf="contact.get('cellphone')?.invalid && contact.get('cellphone')?.touched" class="erp-error-msg">{{ requireDetails ? 'Ingrese un celular válido de 8 dígitos.' : 'El celular debe tener 8 dígitos y comenzar con 6 o 7.' }}</small></div>
          <div class="erp-field"><label class="erp-label">Correo</label><input pInputText formControlName="email" class="erp-input w-full"><small *ngIf="contact.get('email')?.invalid && contact.get('email')?.touched" class="erp-error-msg">Ingrese un correo electrónico válido.</small></div>
          <div *ngIf="showDepartment" class="erp-field"><label class="erp-label">Sucursal / departamento habilitado</label><p-dropdown [options]="departmentOptions" optionLabel="name" optionValue="code" formControlName="department" placeholder="Seleccione departamento" [showClear]="true" appendTo="body" class="w-full"></p-dropdown></div>
        </div>
        <div class="provider-contact-footer">
          <div class="erp-field"><label class="erp-label">Comentarios</label><input pInputText formControlName="comments" maxlength="500" placeholder="Notas del contacto" class="erp-input w-full"></div>
          <div class="erp-field"><label class="erp-label">Contacto principal</label><div class="flex items-center gap-2 min-h-9"><p-inputSwitch formControlName="is_main_contact" (onChange)="main.emit(i)"></p-inputSwitch><span class="text-xs font-semibold" [class.text-erp-success]="contact.get('is_main_contact')?.value">{{ contact.get('is_main_contact')?.value ? 'Sí' : 'No' }}</span></div></div>
          <button type="button" class="btn btn-sm btn-outline-danger self-end" aria-label="Quitar contacto" (click)="remove.emit(i)" [disabled]="contacts.length === 1"><i class="fa-solid fa-trash"></i></button>
        </div>
        <small *ngFor="let error of errors" class="erp-error-msg block mt-1">Contacto {{ i + 1 }}: {{ error }}</small>
      </div>
    </div>
  `,
  styles: [`
    .provider-contact-card { display:grid; gap:.5rem; }
    .provider-contact-identity { display:grid; grid-template-columns:1fr; gap:.5rem; }
    .provider-contact-details { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.5rem; }
    .provider-contact-footer { display:grid; grid-template-columns:minmax(0,1fr) minmax(150px,auto) auto; align-items:end; gap:.5rem; }
    :host ::ng-deep input.ng-invalid.ng-touched, :host ::ng-deep .p-dropdown.ng-invalid.ng-touched, :host ::ng-deep .p-inputswitch.ng-invalid.ng-touched { border-color:var(--color-danger-border) !important; box-shadow:0 0 0 1px var(--color-danger-light); }
    @media(max-width:700px) {
      .provider-contact-identity { grid-template-columns:1fr; }
      .provider-contact-details { grid-template-columns:1fr; }
      .provider-contact-footer { grid-template-columns:minmax(0,1fr) minmax(125px,auto); }
      .provider-contact-footer .erp-field:first-child { grid-column:1/-1; }
      .provider-contact-footer button { grid-column:2; justify-self:end; }
    }
  `],
})
export class ProviderContactsSectionComponent {
  @Input({ required: true }) contacts!: FormArray;
  @Input() errors: string[] = [];
  @Input() commercial = false;
  @Input() requireDetails = true;
  @Input() showDepartment = true;
  @Input() departmentOptions: Array<{ name: string; code: string }> = [];
  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() main = new EventEmitter<number>();

  asGroup(control: unknown): FormGroup { return control as FormGroup; }
}
