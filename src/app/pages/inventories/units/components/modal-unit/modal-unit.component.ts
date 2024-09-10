import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { UnitsService } from '../../../services/units.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-modal-unit',
  templateUrl: './modal-unit.component.html',
  styles: [
  ]
})
export class ModalUnitComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  unitsService      = inject( UnitsService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  isEditSub$!: Subscription;
  unitForm: FormGroup = this.fb.group({
    id: [''],
    name: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(50),this.validatorsService.isSpacesInDynamicTxt]],
    siglas: ['', [ Validators.required,Validators.minLength(1),Validators.maxLength(10),this.validatorsService.isSpacesInDynamicTxt]],
    status: [true]
  });

  ngOnInit(): void {
    this.isEditSub$ = this.unitsService.editSubs.subscribe(resp => {
      this.unitForm.reset({
        id: resp.id,
        name: resp.name,
        siglas: resp.siglas,
        status: resp.status,
      });
    });
  }
  
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newUnit() {
    this.unitForm.markAllAsTouched();
    if(!this.unitForm.valid) return;
    this.loading.set(true);
    this.unitsService.postNew(this.unitForm.value).subscribe({
      complete: () => {
        this.unitsService.save$.next(true);
        this.loading.set(false);
        this.unitsService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Unidad nueva agregada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editUnit() {
    this.unitForm.markAllAsTouched();
    if(!this.unitForm.valid) return;
    this.loading.set(true);
    this.unitsService.putUpdate(this.unitForm.value).subscribe({
      complete: () => {
        this.unitsService.save$.next(true);
        this.loading.set(false);
        this.unitsService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Unidad modificada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.unitForm.reset({
      name: '',
      siglas: '',
      status: true,
    });
  }
}
