import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CajaService } from '../../../services/caja.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-new-detail-caja',
  templateUrl: './modal-new-detail-caja.component.html',
  styles: [
  ]
})
export class ModalNewDetailCajaComponent {
  cajaService      = inject( CajaService );
  validatorsService= inject( ValidatorsService );
  fb               = inject( FormBuilder );
  decimalLength    = signal(this.validatorsService.decimalLength());
  loading          = signal(false);
  form: FormGroup = this.fb.group({
    type: ['', [ Validators.required]],
    monto: ['', [ Validators.required,Validators.min(0.50), Validators.max(100000000)]],
    id_sucursal: [this.validatorsService.id_sucursal(), [ Validators.required]],
    type_payment: ['EFECTIVO',[ Validators.required]],
    description: ['',[Validators.required,Validators.minLength(2),Validators.maxLength(500), this.validatorsService.isSpacesInDynamicTxt]]
  });
  @Output() save$ = new EventEmitter<boolean>();

  
  newDetailCaja() {
    this.form.patchValue({type:this.cajaService.type_movement});
    this.form.markAllAsTouched();
    if(!this.form.valid) return;
    this.loading.set(true);
    this.cajaService.postNewDetailCaja(this.form.value).subscribe({
      complete: () => {
        this.save$.next(true);
        this.loading.set(false);
        this.cajaService.showModalMovementCaja = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `${this.cajaService.type_movement} registrado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.form.reset({
      monto: '',
      id_sucursal: this.validatorsService.id_sucursal(),
      type_payment: 'EFECTIVO',
      description: '',
    });
  }
}
