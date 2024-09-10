import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ScalesService } from '../../../services/scales.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-scale',
  templateUrl: './modal-scale.component.html',
  styles: [
  ]
})
export class ModalScaleComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  scalesService     = inject( ScalesService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  isEditSub$!: Subscription;
  scaleForm: FormGroup = this.fb.group({
    id: [''],
    name: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    cellphone: [ '', [Validators.maxLength(8)]],
    address: [ '', [ Validators.maxLength(200)]],
    status: [true]
  });

  ngOnInit(): void {
    this.isEditSub$ = this.scalesService.editSubs.subscribe(resp => {
      this.scaleForm.reset({
        id: resp.id,
        name: resp.name,
        status: resp.status,
      });
    });
  }
  
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newScale() {
    this.scaleForm.markAllAsTouched();
    if(!this.scaleForm.valid) return;
    this.loading.set(true);
    this.scalesService.postNew(this.scaleForm.value).subscribe({
      complete: () => {
        this.scalesService.save$.next(true);
        this.loading.set(false);
        this.scalesService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Balanza nueva agregada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editScale() {
    this.scaleForm.markAllAsTouched();
    if(!this.scaleForm.valid) return;
    this.loading.set(true);
    this.scalesService.putUpdate(this.scaleForm.value).subscribe({
      complete: () => {
        this.scalesService.save$.next(true);
        this.loading.set(false);
        this.scalesService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Balanza modificada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.scaleForm.reset({
      name: '',
      status: true,
    });
  }
}
