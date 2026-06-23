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
  styles: []
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
