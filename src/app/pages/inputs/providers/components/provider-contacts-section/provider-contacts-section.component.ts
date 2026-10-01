import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-provider-contacts-section',
  template: `
    <div class="mt-3 border-t border-blue-100 pt-2">
      <div class="flex items-center justify-between mb-2">
        <b class="text-xs text-blue-900">Contactos registrados por sede</b>
        <button type="button" class="btn btn-sm btn-outline-primary" (click)="add.emit()"><i class="fa-solid fa-plus"></i> Contacto</button>
      </div>
      <div *ngFor="let contact of contacts.controls; let i = index" [formGroup]="asGroup(contact)" class="erp-form-grid cols-4 mb-2 p-2 bg-white rounded border border-blue-100">
        <div class="erp-field"><label class="erp-label required">Nombre completo</label><input pInputText formControlName="full_name" class="erp-input w-full"></div>
        <div class="erp-field"><label class="erp-label required">Cargo / Área</label><input pInputText formControlName="position_area" class="erp-input w-full"></div>
        <div class="erp-field"><label class="erp-label required">Celular</label><input pInputText formControlName="cellphone" class="erp-input w-full"></div>
        <div class="erp-field"><label class="erp-label">Correo</label><input pInputText formControlName="email" class="erp-input w-full"></div>
        <div class="erp-col-full flex items-center justify-between">
          <label class="text-xs"><input type="radio" name="mainContact" [checked]="contact.get('is_main_contact')?.value" (change)="main.emit(i)"> Contacto principal</label>
          <button type="button" class="btn btn-sm btn-outline-danger" (click)="remove.emit(i)" [disabled]="contacts.length === 1"><i class="fa-solid fa-trash"></i></button>
        </div>
        <small *ngFor="let error of errors" class="erp-error-msg erp-col-full">Contacto {{ i + 1 }}: {{ error }}</small>
      </div>
    </div>
  `,
})
export class ProviderContactsSectionComponent {
  @Input({ required: true }) contacts!: FormArray;
  @Input() errors: string[] = [];
  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() main = new EventEmitter<number>();

  asGroup(control: unknown): FormGroup { return control as FormGroup; }
}
