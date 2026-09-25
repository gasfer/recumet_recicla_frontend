import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { CompaniesService } from '../../../services/companies.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { DecimalFormatService } from 'src/app/services/decimal-format.service';

@Component({
  selector: 'app-modal-company',
  templateUrl: './modal-company.component.html',
  styles: [
  ]
})
export class ModalCompanyComponent implements OnInit, OnDestroy{
  validatorsService = inject( ValidatorsService );
  companiesService  = inject( CompaniesService );
  fb                = inject( FormBuilder );
  decimalFormat     = inject( DecimalFormatService );
  loading           = signal(false);
  companyForm: FormGroup = this.fb.group({
    id: [''],
    name: ['', [ Validators.required,Validators.minLength(2), Validators.maxLength(120) ,this.validatorsService.isSpacesInDynamicTxt]],
    nit: ['',Validators.minLength(3)],
    razon_social: [''],
    activity: [''],
    email: ['', [Validators.pattern(this.validatorsService.emailPattern())]],
    cellphone: [''],
    logo: [''],
    address: [''],
    decimals: [2, [Validators.required, Validators.min(0), Validators.max(4)]],
    status: [true],
  });
  isEditSub$!: Subscription;
  private savedDecimals = 2;

  ngOnInit(): void {
    this.isEditSub$ = this.companiesService.editSubs.subscribe(resp => {
      this.companyForm.reset({
        id: resp.id,
        name: resp.name,
        nit: resp.nit,
        razon_social: resp.razon_social,
        activity: resp.activity,
        email: resp.email,
        cellphone: resp.cellphone,
        logo: resp.logo,
        address: resp.address,
        decimals: resp.decimals,
        status: resp.status,
      });
      this.savedDecimals = resp.decimals;
    });
  }
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  async editCompany() {
    this.companyForm.markAllAsTouched();
    if(!this.companyForm.valid) return;
    if (this.companyForm.value.decimals !== this.savedDecimals) {
      const confirmation = await Swal.fire({
        title: '¿Cambiar precisión operativa?',
        text: 'Afectará operaciones y vistas posteriores; los movimientos históricos no se modificarán.',
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Guardar cambio', cancelButtonText: 'Cancelar',
      });
      if (!confirmation.isConfirmed) return;
    }
    this.loading.set(true);
    this.companiesService.putUpdate(this.companyForm.value).subscribe({
      next: () => this.decimalFormat.setDecimals(this.companyForm.value.decimals),
      complete: () => {
        this.companiesService.save$.next(true);
        this.loading.set(false);
        this.companiesService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `modificado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  changeLogo(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const id = this.companyForm.value.id;
    if (!file || !id) return;
    this.loading.set(true);
    this.companiesService.uploadLogo(id, file).subscribe({
      next: () => this.companiesService.save$.next(true),
      complete: () => this.loading.set(false), error: () => this.loading.set(false),
    });
  }

  resetModal() { 
    this.companyForm.reset({
      id: '',
      name: '',
      nit: '',
      razon_social: '',
      activity: '',
      email: '',
      cellphone: '',
      logo: '',
      address: '',
      decimals: 2,
      status: true,
    });
  }
}
