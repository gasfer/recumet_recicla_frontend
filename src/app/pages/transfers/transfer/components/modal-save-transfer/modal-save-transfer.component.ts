import { Component, computed, inject, Input, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';
import { TransfersService } from '../../../services/transfers.service';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { ComponentsService } from 'src/app/core/services/components.service';

@Component({
  selector: 'app-modal-save-transfer',
  templateUrl: './modal-save-transfer.component.html',
  styles: [
  ]
})
export class ModalSaveTransferComponent {
  validatorsService = inject( ValidatorsService );
  transfersService  = inject( TransfersService );
  sucursalService   = inject( SucursalesService );
  componentService  = inject( ComponentsService );
  fb                = inject( FormBuilder );
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  loading           = signal(false);
  totalSummary      = computed(() => this.transfersService.detailTransfer().reduce( (sum, product) => Number(sum) + Number(product.import),0));
  totalItems        = computed(() => this.transfersService.detailTransfer().length);
  sucursales        = signal<Sucursal[]>([]);

  formTransferData: UntypedFormGroup  = this.fb.group({
    observations_send: ['',[Validators.max(2)]],
    total:[,[Validators.required]],
    id_sucursal_send:[,[Validators.required]],
    id_storage_send:[,[Validators.required]],
    id_sucursal_received: [,[Validators.required]],
  });
  @Input({required: true}) id_sucursal_send : number | null = null;
  @Input({required: true}) id_storage_send : number | null = null;

  ngOnInit(): void {
    this.getAllSucursales();
  }

  getAllSucursales() {
    this.sucursalService.getAllAndSearch(1,100,true).subscribe({
      next: (resp) => {
        this.sucursales.set(resp.sucursales.data);
      },
    });
  }

  saveTransfer() {
    this.formTransferData.markAllAsTouched();
    this.formTransferData.patchValue({id_sucursal_send:this.id_sucursal_send,id_storage_send:this.id_storage_send, total: this.totalSummary()})
    if(!this.formTransferData.valid) return;
    this.loading.set(true);
    const transferDetail = this.transfersService.detailTransfer().map(prod=> ({
      quantity: prod.quantity,
      cost: prod.costo,
      total: prod.import,
      id_product: prod.id,
      status: true 
    }));
    const data = {
      transfer_data: this.formTransferData.value,
      transfer_details: transferDetail
    }
    this.transfersService.postNewTransfer(data).subscribe({
      next: (resp) => {
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Traslado registrado exitosamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.transfersService.showModalSaveTransfer = false;
        this.transfersService.resetTransfer();
        if(this.transfersService._transferConfig.printAfter) {
          this.transfersService.printPdfReport(resp.id_transfer);
        }
        this.componentService.clearInputSearch$.next(true);
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }


  resetModal() {
    this.formTransferData.reset({
      observations_send: '',
      total:'',
      id_sucursal_send:'',
      id_storage_send:'',
      id_sucursal_received:''
    });
  }
}
