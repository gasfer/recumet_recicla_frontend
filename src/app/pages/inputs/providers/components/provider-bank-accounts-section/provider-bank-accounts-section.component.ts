import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';

interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-provider-bank-accounts-section',
  template: `
    <div class="flex items-center justify-between mb-2.5">
      <div class="text-xs font-bold text-cyan-900 uppercase"><i class="fa-solid fa-building-columns text-cyan-600"></i> Información bancaria de la sede</div>
      <button type="button" class="btn btn-sm btn-outline-primary" (click)="add.emit()"><i class="fa-solid fa-plus"></i> Cuenta</button>
    </div>
    <div *ngFor="let account of accounts.controls; let i = index" [formGroup]="asGroup(account)" class="erp-form-grid cols-3 mb-2 p-2 bg-white rounded border border-cyan-100">
      <div class="erp-field"><label class="erp-label required">Banco</label><p-dropdown [options]="banks" optionLabel="name" optionValue="id" formControlName="id_bank" appendTo="body" class="w-full"></p-dropdown></div>
      <div class="erp-field"><label class="erp-label required">Titular</label><input pInputText formControlName="account_holder" class="erp-input w-full"></div>
      <div class="erp-field"><label class="erp-label required">N.º de cuenta</label><input pInputText formControlName="account_number" class="erp-input w-full"></div>
      <div class="erp-field"><label class="erp-label required">Tipo</label><p-dropdown [options]="accountTypeOptions" optionLabel="label" optionValue="value" formControlName="account_type" appendTo="body" class="w-full"></p-dropdown></div>
      <div class="erp-field"><label class="erp-label required">Moneda</label><p-dropdown [options]="currencyOptions" optionLabel="label" optionValue="value" formControlName="currency" appendTo="body" class="w-full"></p-dropdown></div>
      <div class="erp-field flex-row items-end justify-between"><label class="text-xs"><input type="radio" name="mainBank" [checked]="account.get('is_main')?.value" (change)="main.emit(i)"> Principal</label><button type="button" class="btn btn-sm btn-outline-danger" (click)="remove.emit(i)"><i class="fa-solid fa-trash"></i></button></div>
      <small *ngFor="let error of errors" class="erp-error-msg erp-col-full">Cuenta {{ i + 1 }}: {{ error }}</small>
    </div>
    <small *ngIf="accounts.length === 0" class="text-slate-500">Sin cuentas bancarias registradas. Esta sección es opcional.</small>
  `,
})
export class ProviderBankAccountsSectionComponent {
  @Input({ required: true }) accounts!: FormArray;
  @Input() banks: Bank[] = [];
  @Input() accountTypes: readonly SelectOption[] = [];
  @Input() currencies: readonly SelectOption[] = [];
  @Input() errors: string[] = [];
  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() main = new EventEmitter<number>();

  asGroup(control: unknown): FormGroup { return control as FormGroup; }
  get accountTypeOptions(): SelectOption[] { return [...this.accountTypes]; }
  get currencyOptions(): SelectOption[] { return [...this.currencies]; }
}
