import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { StoragesService } from '../../../services/storages.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SucursalesService } from '../../../services/sucursales.service';
import { Sucursal, Sucursales } from '../../../interfaces/sucursales.interface';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-modal-storage',
  templateUrl: './modal-storage.component.html',
  styles: [
  ]
})
export class ModalStorageComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  storageService    = inject( StoragesService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  storageForm: FormGroup = this.fb.group({
    id: [''],
    name: [ '', [ Validators.required,Validators.minLength(2), Validators.maxLength(174) ,this.validatorsService.isSpacesInDynamicTxt]],
    id_sucursal: ['', [ Validators.required]],
    status: [true]
  });
  isEditSub$!: Subscription;

  ngOnInit(): void {
    this.isEditSub$ = this.storageService.editSubs.subscribe(resp => {
      this.storageForm.reset({
        id: resp.id,
        name: resp.name,
        id_sucursal: resp.id_sucursal,
        status: resp.status
      });
    });
  }

  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newStorage() {
    this.storageForm.patchValue({id_sucursal:this.validatorsService.id_sucursal()});
    this.storageForm.markAllAsTouched();
    if(!this.storageForm.valid) return;
    this.loading.set(true);
    this.storageService.postNew(this.storageForm.value).subscribe({
      complete: () => {
        this.storageService.save$.next(true);
        this.loading.set(false);
        this.storageService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Sucursal nueva agregada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.validatorsService.reload_sucursal_storages$.next(true);
      },
      error: () => this.loading.set(false)
    });
  }

  editStorage() {
    this.storageForm.markAllAsTouched();
    if(!this.storageForm.valid) return;
    this.loading.set(true);
    this.storageService.putUpdate(this.storageForm.value).subscribe({
      complete: () => {
        this.storageService.save$.next(true);
        this.loading.set(false);
        this.storageService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Sucursal modificada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.storageForm.reset({
      id: '',
      name: '',
      id_sucursal: '',
      status: true
    });
  }
}
