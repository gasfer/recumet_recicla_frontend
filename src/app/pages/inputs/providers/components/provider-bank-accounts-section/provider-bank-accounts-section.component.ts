import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';

interface SelectOption { label: string; value: string; }

@Component({
  selector: 'app-provider-bank-accounts-section',
  template: `
    <div class="flex items-center justify-between mb-2.5">
      <div class="text-xs font-bold text-cyan-900 uppercase"><i class="fa-solid fa-building-columns text-cyan-600"></i> {{ sectionNumber ? sectionNumber + '. ' : '' }}Información bancaria de la sede</div>
      <button type="button" class="btn btn-sm btn-outline-primary" (click)="add.emit()"><i class="fa-solid fa-plus"></i> Cuenta</button>
    </div>
    <div *ngFor="let account of accounts.controls; let i = index" [formGroup]="asGroup(account)" class="erp-form-grid cols-3 mb-2 p-2.5 bg-white rounded-lg border border-cyan-100 shadow-sm">
      <div class="erp-field"><label class="erp-label required">Banco</label><p-dropdown [options]="banks" optionLabel="name" optionValue="id" formControlName="id_bank" appendTo="body" class="w-full"></p-dropdown></div>
      <div class="erp-field"><label class="erp-label required">Titular</label><input pInputText formControlName="account_holder" class="erp-input w-full" placeholder="Nombre titular"></div>
      <div class="erp-field"><label class="erp-label required">N.º de cuenta</label><input pInputText formControlName="account_number" class="erp-input w-full" placeholder="Ej. 100000000000"></div>
      <div class="erp-field"><label class="erp-label required">Tipo</label><p-dropdown [options]="accountTypeOptions" optionLabel="label" optionValue="value" formControlName="account_type" appendTo="body" class="w-full"></p-dropdown></div>
      <div class="erp-field"><label class="erp-label required">Moneda</label><p-dropdown [options]="currencyOptions" optionLabel="label" optionValue="value" formControlName="currency" appendTo="body" class="w-full"></p-dropdown></div>
      <div class="erp-field flex-row items-end justify-between">
        <label class="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="mainBank" [checked]="account.get('is_main')?.value" (change)="main.emit(i)">
          Cuenta Principal
        </label>
        <button type="button" class="btn btn-sm btn-outline-danger" (click)="remove.emit(i)" title="Eliminar cuenta">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>

      <!-- Adjuntar QR o Comprobante (Checkbox + Drag & Drop) -->
      <div class="erp-col-full mt-2 pt-2 border-t border-slate-100">
        <div class="flex items-center gap-2 mb-2">
          <label class="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" [checked]="accountQrEnabled(i)" (change)="toggleAccountQr(i, $event)" class="rounded text-cyan-600">
            <i class="fa-solid fa-qrcode text-cyan-600"></i> Adjuntar imagen QR o comprobante de cuenta
          </label>
        </div>

        <div *ngIf="accountQrEnabled(i)" class="border-2 border-dashed border-cyan-300 hover:border-cyan-500 rounded-lg p-3 bg-cyan-50/40 text-center transition-colors cursor-pointer"
             (dragover)="$event.preventDefault()" (drop)="onFileDrop(i, $event)" (click)="fileInput.click()">
          <input #fileInput type="file" accept="image/*,application/pdf" hidden (change)="onFileSelected(i, $event)">
          <div *ngIf="!accountQrFile(i)" class="py-1">
            <i class="fa-solid fa-cloud-arrow-up text-cyan-600 text-xl mb-1"></i>
            <p class="text-xs font-semibold text-slate-700 m-0">Arrastre aquí la imagen QR o PDF de la cuenta, o haga clic para seleccionar</p>
            <span class="text-[11px] text-slate-500">Formatos soportados: PNG, JPG, WEBP, PDF (máx. 5 MB)</span>
          </div>
          <div *ngIf="accountQrFile(i)" class="flex items-center justify-between px-2 py-1 bg-white rounded border border-cyan-200" (click)="$event.stopPropagation()">
            <div class="flex items-center gap-2 overflow-hidden text-left">
              <i class="fa-solid fa-file-image text-cyan-600 text-lg"></i>
              <div>
                <span class="text-xs font-bold text-slate-800 block truncate">{{ accountQrFile(i)?.name }}</span>
                <span class="text-[10px] text-slate-500">{{ formatFileSize(accountQrFile(i)?.size || 0) }}</span>
              </div>
            </div>
            <button type="button" class="btn btn-xs btn-outline-danger text-xs px-2 py-0.5 rounded" (click)="clearQrFile(i)" title="Quitar archivo">
              <i class="fa-solid fa-xmark"></i> Quitar
            </button>
          </div>
        </div>
      </div>

      <small *ngFor="let error of errors" class="erp-error-msg erp-col-full">Cuenta {{ i + 1 }}: {{ error }}</small>
    </div>
    <small *ngIf="accounts.length === 0" class="text-slate-500">Sin cuentas bancarias registradas. Esta sección es opcional.</small>
  `,
})
export class ProviderBankAccountsSectionComponent {
  @Input() sectionNumber: number | null = null;
  @Input({ required: true }) accounts!: FormArray;
  @Input() banks: Bank[] = [];
  @Input() accountTypes: readonly SelectOption[] = [];
  @Input() currencies: readonly SelectOption[] = [];
  @Input() errors: string[] = [];
  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
  @Output() main = new EventEmitter<number>();

  qrFiles = signal<Record<number, File | null>>({});
  qrEnabledMap = signal<Record<number, boolean>>({});

  asGroup(control: unknown): FormGroup { return control as FormGroup; }
  get accountTypeOptions(): SelectOption[] { return [...this.accountTypes]; }
  get currencyOptions(): SelectOption[] { return [...this.currencies]; }

  accountQrEnabled(index: number): boolean {
    return !!this.qrEnabledMap()[index];
  }

  toggleAccountQr(index: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.qrEnabledMap.update(m => ({ ...m, [index]: checked }));
    if (!checked) {
      this.clearQrFile(index);
    }
  }

  accountQrFile(index: number): File | null {
    return this.qrFiles()[index] || null;
  }

  onFileSelected(index: number, event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(index, file);
  }

  onFileDrop(index: number, event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(index, file);
  }

  private setFile(index: number, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera los 5 MB permitidos.');
      return;
    }
    this.qrFiles.update(m => ({ ...m, [index]: file }));
  }

  clearQrFile(index: number) {
    this.qrFiles.update(m => {
      const copy = { ...m };
      delete copy[index];
      return copy;
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
