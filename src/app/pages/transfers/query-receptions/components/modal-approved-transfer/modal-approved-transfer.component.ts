import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { TransfersService } from '../../../services/transfers.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';

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

  @Input({required:true}) id_transfer = 0;
  @Output() save$ = new EventEmitter<boolean>();

  approvedForm: FormGroup = this.fb.group({
    id_transfer: ['',[Validators.required]],
    id_storage_received: [ '', [Validators.required]],
    observations_received: ['', [ Validators.max(500)]],
  });

  postApprovedTransfer() {
    this.approvedForm.markAllAsTouched();
    this.approvedForm.patchValue({id_transfer:this.id_transfer})
    if(!this.approvedForm.valid) return;
    this.loading.set(true);
    this.transfersService.putTransferToReceived(this.approvedForm.value).subscribe({
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
      }
    })
    
  }

  resetModal() {
    this.approvedForm.reset({
      id_transfer: '',
      id_storage_received: '',
      observations_received: '',
    })
  }
}
