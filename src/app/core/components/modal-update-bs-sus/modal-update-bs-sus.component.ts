import { Component, computed, EventEmitter, inject, Input, Output, signal, ViewChild } from '@angular/core';
import { ComponentsService } from '../../services/components.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-update-bs-sus',
  templateUrl: './modal-update-bs-sus.component.html',
  styles: []
})
export class ModalUpdateBsSusComponent {
  componentsService = inject(ComponentsService);
  validatorsService = inject(ValidatorsService);
  fb                = inject( FormBuilder );
  user              = computed(() => {this.validatorsService.user()});
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  previewCambio     = signal(0);
  @Input({required:true}) cambio          = 0;
  @Output() onNewBs: EventEmitter<number> = new EventEmitter();
  @ViewChild("txtInputCambio") txtInputCambio: any;

  updateBsForm: FormGroup = this.fb.group({
    actual_cambio: [6.96],
    cambio: [this.cambio],
  });


  updateBsSus() {
    const newUpdate = this.newCambio();
    this.onNewBs.next(newUpdate);
    this.componentsService.setShowModalBsSus = false;
  }

  newCambio() : number {
    const cambio_actual = this.updateBsForm.get('actual_cambio')?.value;
    const cambio        = this.updateBsForm.get('cambio')?.value;  
    const newUpdate     = Number(cambio_actual) * Number(cambio);
    this.previewCambio.set(newUpdate);
    return newUpdate;
  }

  focusOnInput()  {
    this.updateBsForm.patchValue({
      cambio: this.cambio
    });
    this.txtInputCambio.input.nativeElement.focus();
    this.newCambio();
  }
}
