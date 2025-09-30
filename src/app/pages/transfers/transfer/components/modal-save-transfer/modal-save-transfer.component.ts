import { Component, computed, inject, Input, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';
import { TransfersService } from '../../../services/transfers.service';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { ComponentsService } from 'src/app/core/services/components.service';
import { ScalesService } from 'src/app/pages/inventories/services/scales.service';
import { Scale } from 'src/app/pages/inventories/interfaces/scale.interface';
import { InputsService } from 'src/app/pages/inputs/services/inputs.service';

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
  inputsService     = inject( InputsService );
  scalesService     = inject( ScalesService );
  fb                = inject( FormBuilder );
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  loading           = signal(false);
  totalSummary      = computed(() => this.transfersService.detailTransfer().reduce( (sum, product) => Number(sum) + Number(product.import),0));
  totalSummaryItems = computed(() => this.transfersService.detailTransfer().reduce( (sum, product) => Number(sum) + Number(product.quantity),0));
  totalItems        = computed(() => this.transfersService.detailTransfer().length);
  sucursales        = signal<Sucursal[]>([]);
  scalas            = signal<Scale[]>([]);
  types_registry    = computed(() => this.inputsService.types_registry());

  formTransferData: UntypedFormGroup  = this.fb.group({
    observations_send: ['',[Validators.max(2)]],
    total:[,[Validators.required]],
    id_sucursal_send:[,[Validators.required]],
    id_storage_send:[,[Validators.required]],
    date_send:[new Date(),[Validators.required]],
    id_sucursal_received: [,[Validators.required]],
    type_registry: ['BOLETA',[Validators.required]],
    registry_number: ['',[Validators.required]],
    id_scales: [1,[Validators.required]],
  });
  @Input({required: true}) id_sucursal_send : number | null = null;
  @Input({required: true}) id_storage_send : number | null = null;

  ngOnInit(): void {
    this.getAllSucursales();
    this.getAllScalas();
  }

  getAllSucursales() {
    this.sucursalService.getAllAndSearch(1,100,true).subscribe({
      next: (resp) => {
        this.sucursales.set(resp.sucursales.data);
      },
    });
  }

  getAllScalas() {
    this.scalesService.getAllAndSearch(1,10000,true).subscribe({
      next: (resp) => this.scalas.set(resp.scales.data),
      error: () => this.scalas.set([])
    });
  }

  selectTypeRegistry() {
    const type_registry = this.formTransferData.get('type_registry')?.value;
    this.formTransferData.patchValue({registry_number: ''});
    if(type_registry == 'SIN FICHA') {
      this.formTransferData.get('registry_number')?.setValidators([]);
    } else {
      this.formTransferData.get('registry_number')?.setValidators([Validators.required]);
    }
    this.formTransferData.get('registry_number')?.updateValueAndValidity();
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
      date_send: new Date(),
      id_sucursal_send:'',
      id_storage_send:'',
      id_sucursal_received:'',
      type_registry: null,
      registry_number: null,
      id_scales: null,
    });
  }
}
