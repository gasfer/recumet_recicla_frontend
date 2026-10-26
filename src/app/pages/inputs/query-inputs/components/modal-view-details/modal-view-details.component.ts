import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { Subscription } from 'rxjs';
import { Input } from '../../../interfaces/input.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-view-details-input',
  templateUrl: './modal-view-details.component.html',
  styles: [`
    :host ::ng-deep .purchase-detail-dialog .p-dialog-header { background:var(--color-table-header); color:var(--color-text-inverse); padding:.7rem 1rem; }
    :host ::ng-deep .purchase-detail-dialog .p-dialog-title { font-size:.9rem; font-weight:700; }
    :host ::ng-deep .purchase-detail-dialog .p-dialog-content { padding:.85rem; }
    :host ::ng-deep .purchase-detail-dialog .p-dialog-footer { padding:.55rem .85rem; }
    .purchase-detail-table { width:100%; border-collapse:collapse; font-size:.76rem; color:var(--color-text); }
    .purchase-detail-table th,.purchase-detail-table td { padding:.4rem .5rem; border:1px solid var(--color-border); vertical-align:top; }
    .purchase-detail-table th { width:20%; background:var(--color-surface-secondary); color:var(--color-text); font-size:.68rem; text-align:left; white-space:nowrap; }
    .purchase-detail-lines th { background:var(--color-table-header); color:var(--color-text-inverse); text-transform:uppercase; font-size:.67rem; }
    .purchase-detail-lines tfoot th { background:var(--color-surface-secondary); color:var(--color-text); }
    .purchase-detail-lines .purchase-total-label { color:var(--color-primary); background:var(--color-success-light); }
    .purchase-detail-lines .purchase-total-value { color:var(--color-primary); background:var(--color-success-light); font-weight:700; }
    @media(max-width:600px) { .purchase-detail-table th,.purchase-detail-table td { padding:.35rem; font-size:.7rem; } .purchase-detail-table th { white-space:normal; } }
  `]
})
export class ModalViewDetailsComponent implements OnInit, OnDestroy {
  inputService = inject(InputsService);
  validatorsService = inject(ValidatorsService);
  viewDetailsSub$!: Subscription;
  input = signal<Input | undefined>(undefined);
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  ngOnInit(): void {
    this.viewDetailsSub$ = this.inputService.detailsSubs$.subscribe((input: Input) => {
      let totalQuantity = 0;
      input.detailsInput.forEach(resp => {
        totalQuantity += Number(resp.quantity);
      })
      input.totalQuantity = totalQuantity;
      this.input.set(input);
    });
  }

  ngOnDestroy(): void {
    this.viewDetailsSub$.unsubscribe();
  }

  viewAttachedVoucher(payment_voucher?: string) {
    if (!payment_voucher) return;
    const url = `${environment.base_url}/file/vouchers/${payment_voucher}`;
    window.open(url, '_blank');
  }

  triggerFileUpload(inputId?: number) {
    if (!inputId) return;
    const fileInput = document.getElementById('file-upload-input-' + inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: any, inputId?: number) {
    if (event.target.files && event.target.files.length > 0 && inputId) {
      const file = event.target.files[0];
      this.uploadVoucher(inputId, file);
    }
  }

  uploadVoucher(inputId: number, file: File) {
    Swal.fire({
      title: 'Subiendo comprobante...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false
    });
    
    this.inputService.uploadVoucher(inputId, file).subscribe({
      next: (resp: any) => {
        Swal.fire({
          title: 'Éxito!',
          text: 'Comprobante subido correctamente.',
          icon: 'success',
          customClass: { container: 'swal-alert' }
        });
        
        // Recargar el objeto input de la modal
        this.inputService.getInputById(inputId.toString()).subscribe({
          next: (getOneInput) => {
            const updatedInput = getOneInput.input;
            let totalQuantity = 0;
            updatedInput.detailsInput.forEach(resp => {
              totalQuantity += Number(resp.quantity);
            })
            updatedInput.totalQuantity = totalQuantity;
            this.input.set(updatedInput);
          }
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Error',
          text: err?.error?.errors?.[0]?.msg || 'No se pudo subir el comprobante.',
          icon: 'error',
          customClass: { container: 'swal-alert' }
        });
      }
    });
  }
}
