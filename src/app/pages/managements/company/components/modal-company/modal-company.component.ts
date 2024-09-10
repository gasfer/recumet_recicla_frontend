import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { CompaniesService } from '../../../services/companies.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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
    status: [true],
  });
  isEditSub$!: Subscription;

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
        status: resp.status,
      });
    });
  }
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  editCompany() {
    this.companyForm.markAllAsTouched();
    if(!this.companyForm.valid) return;
    this.loading.set(true);
    this.companiesService.putUpdate(this.companyForm.value).subscribe({
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
      status: true,
    });
  }
}
