import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Company } from '../interfaces/companies.interfaces';
import { CompaniesService } from '../services/companies.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { DecimalFormatService } from 'src/app/services/decimal-format.service';
import { InputsService } from '../../inputs/services/inputs.service';
import { environment } from 'src/environments/environment';

type PrintFormat = 'HALF_PAGE' | 'ROLL';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styles: [`
    .company-preview { background: #f8fafc; min-height: 100%; }
    .company-logo { height: 112px; max-width: 180px; object-fit: contain; }
    .print-format-option { min-height: 116px; text-align: left; }
    .print-format-option.selected { border: 2px solid var(--primary-color); background: color-mix(in srgb, var(--primary-color) 8%, white); }
  `],
})
export class CompanyComponent implements OnInit {
  loading = signal(false);
  uploadingLogo = signal(false);
  company = signal<Company | undefined>(undefined);
  printFormat = signal<PrintFormat>(localStorage.getItem('companyPrintFormat') === 'ROLL' ? 'ROLL' : 'HALF_PAGE');
  logoUrl = computed(() => `${environment.base_url.replace('/api/v1', '')}/uploads/logo.png?v=${this.company()?.updatedAt || ''}`);

  private companiesService = inject(CompaniesService);
  private inputsService = inject(InputsService);
  private fb = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  decimalFormat = inject(DecimalFormatService);
  private savedDecimals = 2;

  companyForm: FormGroup = this.fb.group({
    id: [''], name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120), this.validatorsService.isSpacesInDynamicTxt]],
    nit: ['', Validators.minLength(3)], razon_social: [''], activity: [''],
    email: ['', Validators.pattern(this.validatorsService.emailPattern())], cellphone: [''], address: [''],
    decimals: [2, [Validators.required, Validators.min(0), Validators.max(4)]], status: [true],
  });

  ngOnInit(): void { this.loadCompany(); }

  loadCompany(): void {
    this.loading.set(true);
    this.companiesService.getAllAndSearch(1, 1, true).subscribe({
      next: response => {
        const current = response.companies.data[0];
        this.company.set(current);
        if (!current) return;
        this.companyForm.patchValue(current);
        this.savedDecimals = current.decimals;
        this.decimalFormat.setDecimals(current.decimals);
      }, complete: () => this.loading.set(false), error: () => this.loading.set(false),
    });
  }

  selectPrintFormat(format: PrintFormat): void { this.printFormat.set(format); }

  async save(): Promise<void> {
    this.companyForm.markAllAsTouched();
    if (!this.companyForm.valid || !this.validatorsService.withPermission('EMPRESA', 'update')) return;
    if (this.companyForm.value.decimals !== this.savedDecimals) {
      const confirmation = await Swal.fire({ title: '¿Cambiar precisión operativa?', text: 'Afectará operaciones y vistas posteriores; los movimientos históricos no se modificarán.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Guardar cambio', cancelButtonText: 'Cancelar' });
      if (!confirmation.isConfirmed) return;
    }
    this.loading.set(true);
    this.companiesService.putUpdate(this.companyForm.value).subscribe({
      next: () => {
        const format = this.printFormat();
        localStorage.setItem('companyPrintFormat', format);
        localStorage.setItem('printRoll', String(format === 'ROLL'));
        localStorage.setItem('printHalfPage', String(format === 'HALF_PAGE'));
        this.inputsService._inputConfig = { ...this.inputsService._inputConfig, printRoll: format === 'ROLL', printHalfPage: format === 'HALF_PAGE' };
        this.decimalFormat.setDecimals(this.companyForm.value.decimals);
        this.savedDecimals = this.companyForm.value.decimals;
        this.companiesService.save$.next(true);
        void Swal.fire('Configuración guardada', 'Los datos y preferencias de impresión fueron actualizados.', 'success');
      }, complete: () => this.loading.set(false), error: () => this.loading.set(false),
    });
  }

  changeLogo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const id = this.companyForm.value.id;
    if (!file || !id || !this.validatorsService.withPermission('EMPRESA', 'update')) return;
    this.uploadingLogo.set(true);
    this.companiesService.uploadLogo(id, file).subscribe({
      next: () => { this.companiesService.save$.next(true); this.loadCompany(); void Swal.fire('Logo actualizado', 'Se usará en los reportes y comprobantes impresos.', 'success'); },
      complete: () => this.uploadingLogo.set(false), error: () => this.uploadingLogo.set(false),
    });
  }
}
