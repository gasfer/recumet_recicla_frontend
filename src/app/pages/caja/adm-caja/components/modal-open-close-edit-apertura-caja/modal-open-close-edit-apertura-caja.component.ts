import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CajaService } from '../../../services/caja.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { GetAllTotalesMovements } from '../../../interfaces/adm-caja.interface';

@Component({
  selector: 'app-modal-open-close-edit-apertura-caja',
  templateUrl: './modal-open-close-edit-apertura-caja.component.html',
  styles: [
  ]
})
export class ModalOpenCloseEditAperturaCajaComponent {
  cajaService      = inject( CajaService );
  validatorsService= inject( ValidatorsService );
  fb               = inject( FormBuilder );
  decimalLength    = signal(this.validatorsService.decimalLength());
  loading          = signal(false);
  form: FormGroup = this.fb.group({
    monto: [ '', [ Validators.required,Validators.min(0), Validators.max(100000000)]],
    id_sucursal: [this.validatorsService.id_sucursal(), [ Validators.required]],
  });
  @Output() save$ = new EventEmitter<boolean>();
  @Input() totalMovements: GetAllTotalesMovements | undefined = undefined;

  showModal() {
    switch (this.cajaService.type_event) {
      case 'OPEN_CAJA':
        this.form.patchValue({monto: 0});
        break;
      case 'UPDATE_CAJA':
        this.form.patchValue({monto: this.totalMovements?.monto_apertura});
        break;  
      case 'CLOSE_CAJA':
        this.form.patchValue({monto: this.totalMovements?.monto_apertura_mas_saldo});
        break;
      default:
        break;
    }
  }


  saveCaja() {
    switch (this.cajaService.type_event) {
      case 'OPEN_CAJA':
        this.openCaja();
        break;
      case 'UPDATE_CAJA':
        this.updateCaja();
        break;  
      case 'CLOSE_CAJA':
        this.closeCaja();
        break;
      default:
        break;
    }
  }


  openCaja() {
    this.form.markAllAsTouched();
    if(!this.form.valid) return;
    this.loading.set(true);
    this.cajaService.postOpenCaja(this.form.get('id_sucursal')?.value,this.form.get('monto')?.value).subscribe({
      complete: () => {
        this.loading.set(false);
        this.cajaService.showModalOpenCaja = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Apertura de caja correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.save$.next(true);
      },
      error: () => this.loading.set(false) 
    });
  }

  closeCaja() {
    this.form.markAllAsTouched();
    if(!this.form.valid) return;
    this.loading.set(true);
    this.cajaService.putCierreCaja(this.form.get('id_sucursal')?.value,this.form.get('monto')?.value).subscribe({
      complete: () => {
        this.loading.set(false);
        this.cajaService.showModalOpenCaja = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Caja cerrada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        }).then(() => {
          this.cajaService.printPdfArqueoCaja(this.totalMovements!.id_caja_small);
          this.save$.next(true);
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  updateCaja() {
    this.form.markAllAsTouched();
    if(!this.form.valid) return;
    this.loading.set(true);
    this.cajaService.putUpdateMontoCaja(this.form.get('id_sucursal')?.value,this.form.get('monto')?.value).subscribe({
      complete: () => {
        this.loading.set(false);
        this.cajaService.showModalOpenCaja = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Monto modificado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.save$.next(true);
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.form.reset({
      id_sucursal: this.validatorsService.id_sucursal(),
      monto: '',
    });
  }
}
