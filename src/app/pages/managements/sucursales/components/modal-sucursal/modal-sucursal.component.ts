import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { SucursalesService } from '../../../services/sucursales.service';

@Component({
  selector: 'app-modal-sucursal',
  templateUrl: './modal-sucursal.component.html',
  styles: [
  ]
})
export class ModalSucursalComponent implements OnInit , OnDestroy {
  validatorsService = inject( ValidatorsService );
  sucursalService   = inject( SucursalesService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  sucursalForm: FormGroup = this.fb.group({
    id: [''],
    name: [ '', [ Validators.required,Validators.minLength(2), Validators.maxLength(75) ,this.validatorsService.isSpacesInDynamicTxt]],
    cellphone: [null, [ Validators.required,Validators.min(60000000), Validators.max(79999999)]],
    address: ['', [ Validators.required,Validators.required,Validators.minLength(4), Validators.maxLength(175),this.validatorsService.isSpacesInDynamicTxt]],
    email: ['', [Validators.pattern(this.validatorsService.emailPattern())]],
    city: ['CBBA', [ Validators.required]],
    type: ['NINGUNO', [ Validators.required]],
    status: [true]
  });
  isEditSub$!: Subscription;

  ngOnInit(): void {
    this.isEditSub$ = this.sucursalService.editSubs.subscribe(resp => {
      this.sucursalForm.reset({
        id: resp.id,
        name: resp.name,
        cellphone: resp.cellphone,
        address: resp.address,
        email: resp.email,
        city: resp.city,
        type: resp.type,
        status: resp.status,
      });
    });
  }
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newSucursal() {
    this.sucursalForm.markAllAsTouched();
    if(!this.sucursalForm.valid) return;
    this.loading.set(true);
    this.sucursalService.postNew(this.sucursalForm.value).subscribe({
      complete: () => {
        this.sucursalService.save$.next(true);
        this.loading.set(false);
        this.sucursalService.showModal = false;
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

  editSucursal() {
    this.sucursalForm.markAllAsTouched();
    if(!this.sucursalForm.valid) return;
    this.loading.set(true);
    this.sucursalService.putUpdate(this.sucursalForm.value).subscribe({
      complete: () => {
        this.sucursalService.save$.next(true);
        this.loading.set(false);
        this.sucursalService.showModal = false;
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
    this.sucursalForm.reset({
      id : '',
      name : '',
      cellphone : null,
      address : '',
      email : '',
      city : 'CBBA',
      type : 'NINGUNO',
      status : true,
    });
  }
}
