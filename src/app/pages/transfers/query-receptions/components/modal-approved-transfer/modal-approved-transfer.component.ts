import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { TransfersService } from '../../../services/transfers.service';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';
import { Transfer } from '../../../interfaces/transfers.interface';

@Component({
  selector: 'app-modal-approved-transfer',
  templateUrl: './modal-approved-transfer.component.html',
  styles: [
  ]
})
export class ModalApprovedTransferComponent {
  transfersService  = inject( TransfersService );
  validatorsService = inject( ValidatorsService );
  fb                = inject( FormBuilder );
  loading           = signal( false );

  transfer          = signal<Transfer|undefined>(undefined);
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  _id_transfer = 0;

 onDialogShow() {
  if (this._id_transfer) {
    this.loadTransferDetails(this._id_transfer);
  }
}

@Input({required:true}) set id_transfer(val: number) {
  this._id_transfer = val;
  // ya no llames loadTransferDetails aquí
}
  get id_transfer() {
    return this._id_transfer;
  }

  @Output() save$ = new EventEmitter<boolean>();

  approvedForm: FormGroup = this.fb.group({
    id_transfer: ['',[Validators.required]],
    id_storage_received: [ '', [Validators.required]],
    date_received: [new Date(), [Validators.required]],
    observations_received: ['', [ Validators.maxLength(500)]],
    details: this.fb.array([])
  });

  get detailsFormArray(): FormArray {
    return this.approvedForm.get('details') as FormArray;
  }

  loadTransferDetails(id: number) {
    this.transfersService.getTransferById(id.toString()).subscribe({
      next: (resp) => {
        this.transfer.set(resp.transfer);
        const detailsArray = this.detailsFormArray;
        detailsArray.clear();
        if (resp.transfer?.detailsTransfers) {
          resp.transfer.detailsTransfers.forEach(detail => {
            detailsArray.push(this.fb.group({
              id_detail: [detail.id, [Validators.required]],
              id_product: [detail.id_product],
              product_name: [detail.product.name],
              product_cod: [detail.product.cod],
              quantity_sent: [Number(detail.quantity)],
              quantity_received: [Number(detail.quantity), [Validators.required, Validators.min(0)]],
              observation: ['', [Validators.maxLength(500)]]
            }));
          });
        }
        this.checkObservationsRequirement();
      }
    });
  }

  onReceivedInput(event: any, group: AbstractControl) {
    const value = event.value !== null && event.value !== undefined ? Number(event.value) : 0;
    group.get('quantity_received')?.setValue(value, { emitEvent: false });
    this.checkObservationsRequirement();
  }

  checkObservationsRequirement() {
    const detailsArray = this.detailsFormArray;
    for (let i = 0; i < detailsArray.length; i++) {
      const group = detailsArray.at(i) as FormGroup;
      const sent = group.get('quantity_sent')?.value || 0;
      const received = group.get('quantity_received')?.value || 0;
      const obsControl = group.get('observation');

      let requiresObservation = false;
      if (sent > 0) {
        const diffPct = ((received - sent) / sent) * 100;
        if (Math.abs(diffPct) >= 1.0) {
          requiresObservation = true;
        }
      }

      if (requiresObservation) {
        obsControl?.setValidators([Validators.required, Validators.maxLength(500)]);
      } else {
        obsControl?.setValidators([Validators.maxLength(500)]);
      }
      obsControl?.updateValueAndValidity();
    }
  }

  isProductObservationRequired(group: any): boolean {
    const sent = group.get('quantity_sent')?.value || 0;
    const received = group.get('quantity_received')?.value || 0;
    if (sent === 0) return false;
    const diffPct = ((received - sent) / sent) * 100;
    return Math.abs(diffPct) >= 1.0;
  }

  getDiffPercentage(group: any): number {
    const sent = group.get('quantity_sent')?.value || 0;
    const received = group.get('quantity_received')?.value || 0;
    if (sent === 0) return 0;
    return ((received - sent) / sent) * 100;
  }

  getDiffClass(group: any): string {
    const pct = this.getDiffPercentage(group);
    if (Math.abs(pct) >= 1.0) {
      return 'text-danger fw-bold';
    }
    return 'text-success';
  }

  getExcedente(group: any): number {
    const sent = Number(group.get('quantity_sent')?.value) || 0;
    const received = Number(group.get('quantity_received')?.value) || 0;
    return Math.max(0, received - sent);
  }

  getFaltante(group: any): number {
    const sent = Number(group.get('quantity_sent')?.value) || 0;
    const received = Number(group.get('quantity_received')?.value) || 0;
    return Math.max(0, sent - received);
  }

  getTotalExcedente(): number {
    return this.detailsFormArray.controls.reduce((sum, group) => {
      return sum + this.getExcedente(group);
    }, 0);
  }

  getTotalFaltante(): number {
    return this.detailsFormArray.controls.reduce((sum, group) => {
      return sum + this.getFaltante(group);
    }, 0);
  }

/********* */
getTotalSent(): number {
  return this.detailsFormArray.controls.reduce((sum, group) => {
    return sum + (Number(group.get('quantity_sent')?.value) || 0);
  }, 0);
}

getTotalReceived(): number {
  return this.detailsFormArray.controls.reduce((sum, group) => {
    return sum + (Number(group.get('quantity_received')?.value) || 0);
  }, 0);
}

getTotalDiffPercentage(): number {
  const totalSent = this.getTotalSent();
  const totalReceived = this.getTotalReceived();
  if (totalSent === 0) return 0;
  return ((totalReceived - totalSent) / totalSent) * 100;
}

getTotalDiffClass(): string {
  const diff = this.getTotalDiffPercentage();
  if (diff < 0) return 'text-danger fw-bold';
  if (diff > 0) return 'text-warning fw-bold';
  return 'text-success fw-bold';
}
/******** */
  postApprovedTransfer() {
    this.approvedForm.markAllAsTouched();
    this.approvedForm.patchValue({id_transfer:this.id_transfer})
    this.checkObservationsRequirement();

    if(!this.approvedForm.valid) return;
    this.loading.set(true);

    const formValue = this.approvedForm.value;
    const payload = {
      id_transfer: formValue.id_transfer,
      id_storage_received: formValue.id_storage_received,
      date_received: formValue.date_received,
      observations_received: formValue.observations_received,
      details: formValue.details.map((d: any) => ({
        id_detail: d.id_detail,
        quantity_received: d.quantity_received,
        observation: d.observation
      }))
    };

    this.transfersService.putTransferToReceived(payload).subscribe({
      next: () => {
        this.loading.set(false);
        Swal.fire({
          title: 'Éxito!',
          text: `Traslado recepcionado exitosamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.transfersService.showModalConfirmationReception = false;
        this.resetModal();
        this.save$.next(true);
      },
      error: (err) => this.loading.set(false)
    })

  }

  resetModal() {
    this.approvedForm.reset({
      id_transfer: '',
      date_received: new Date(),
      id_storage_received: '',
      observations_received: '',
    });
    this.detailsFormArray.clear();
    this.transfer.set(undefined);
  }
}


