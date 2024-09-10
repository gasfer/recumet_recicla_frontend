import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ClientsService } from '../../../services/clients.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-modal-client',
  templateUrl: './modal-client.component.html',
  styles: [
  ]
})
export class ModalClientComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  clientsService    = inject( ClientsService );
  authService    = inject( AuthService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  isEditSub$!:   Subscription;
  types = signal([
    { name: 'NATURAL', code: 'NATURAL'},
    { name: 'JURÍDICA', code: 'JURIDICO'},
  ]);
  clientForm: FormGroup = this.fb.group({
    id: [''],
    full_names: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    number_document: [null, [Validators.required,Validators.maxLength(50)]],
    cellphone: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    business_name: [ null, [Validators.maxLength(254)]],
    type: ['NATURAL', [Validators.required]],
    id_sucursal: [ null],
    status: [true]
  });

  ngOnInit(): void {
    this.isEditSub$ = this.clientsService.editSubs.subscribe(resp => {
      this.clientForm.reset({
        id: resp.id,
        full_names: resp.full_names,
        number_document: resp.number_document,
        cellphone: resp.cellphone,
        business_name: resp.business_name,
        type: resp.type,
        id_sucursal: resp.id_sucursal,
        status: resp.status,
      });
    });
  }
  
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }

  
  newClient() {
    this.clientForm.markAllAsTouched();
    if(!this.clientForm.valid) return;
    this.loading.set(true);
    this.clientsService.postNew(this.clientForm.value).subscribe({
      complete: () => {
        this.clientsService.save$.next(true);
        this.loading.set(false);
        this.clientsService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Cliente nuevo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editClient() {
    this.clientForm.markAllAsTouched();
    if(!this.clientForm.valid) return;
    this.loading.set(true);
    this.clientsService.putUpdate(this.clientForm.value).subscribe({
      complete: () => {
        this.clientsService.save$.next(true);
        this.loading.set(false);
        this.clientsService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Cliente modificado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.clientForm.reset({
      id: '',
      full_names: '',
      number_document: null,
      cellphone: null,
      business_name: null,
      type: '',
      id_sucursal: null,
      status: true,
    });
  }
}
