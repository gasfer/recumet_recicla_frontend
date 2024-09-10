import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransportCompanyService } from '../../../services/trasport-company.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-trasport-company',
  templateUrl: './modal-trasport-company.component.html',
  styles: [
  ]
})
export class ModalTrasportCompanyComponent implements OnInit, OnDestroy {
  validatorsService       = inject( ValidatorsService );
  transportCompanyService = inject( TransportCompanyService );
  fb                      = inject( FormBuilder );
  loading                 = signal(false);
  isEditSub$!: Subscription;
  transportCompanyForm: FormGroup = this.fb.group({
    id: [''],
    name: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    nit: [ null, [Validators.maxLength(50)]],
    city: [ null, [Validators.maxLength(74)]],
    address: [ null, [Validators.minLength(2),Validators.maxLength(250)]],
    cellphone: [null, [Validators.min(60000000), Validators.max(79999999)]],
    status: [true]
  });

  ngOnInit(): void {
    this.isEditSub$ = this.transportCompanyService.editSubs.subscribe(resp => {
      this.transportCompanyForm.reset({
        id: resp.id,
        name: resp.name,
        nit: resp.nit,
        city: resp.city,
        address: resp.address,
        cellphone: resp.cellphone,
        status: resp.status,
      });
    });
  }
  
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newTrasportCompany() {
    this.transportCompanyForm.markAllAsTouched();
    if(!this.transportCompanyForm.valid) return;
    this.loading.set(true);
    this.transportCompanyService.postNew(this.transportCompanyForm.value).subscribe({
      complete: () => {
        this.transportCompanyService.save$.next(true);
        this.loading.set(false);
        this.transportCompanyService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Compañía de trasporte nueva agregada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editTrasportCompany() {
    this.transportCompanyForm.markAllAsTouched();
    if(!this.transportCompanyForm.valid) return;
    this.loading.set(true);
    this.transportCompanyService.putUpdate(this.transportCompanyForm.value).subscribe({
      complete: () => {
        this.transportCompanyService.save$.next(true);
        this.loading.set(false);
        this.transportCompanyService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Compañía de trasporte modificada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.transportCompanyForm.reset({
      id: '',
      name: '',
      nit: null,
      city: null,
      address: null,
      cellphone: null,
      status: true,
    });
  }
}
