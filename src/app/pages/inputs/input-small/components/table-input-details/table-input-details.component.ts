import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ComponentsService } from 'src/app/core/services/components.service';
import Swal from 'sweetalert2';
import { DecimalFormatService } from 'src/app/services/decimal-format.service';
import { isPurchaseEditWindowExpired } from 'src/app/core/utils/purchase-edit-access';
import { Router } from '@angular/router';

@Component({
  selector: 'app-table-input-details',
  templateUrl: './table-input-details.component.html',
  styleUrls: ['./table-input-details.component.scss']
})
export class TableInputDetailsComponent implements OnDestroy {
  inputsService       = inject( InputsService );
  validatorsService   = inject( ValidatorsService );
  componentsService   = inject( ComponentsService );
  decimalFormat       = inject( DecimalFormatService );
  private router      = inject(Router);
  product_temp        = signal<Product|undefined>(undefined);
  totalSummary        = computed(() => this.inputsService.detailShopping().reduce( (sum, product) => Number(sum) + Number(product.import),0));
  totalQuantitySummary = computed(() => this.inputsService.detailShopping().reduce((sum, product) => sum + Number(product.quantity || 0), 0));

  isWeighingOperator(): boolean {
    return this.validatorsService.user()?.role === 'OPERADOR_BALANZA';
  }

  isLatePriceCorrection(): boolean {
    return this.inputsService.isEdit
      && isPurchaseEditWindowExpired(this.inputsService.dataInputForEdit()?.date_voucher);
  }

  ngOnDestroy(): void {
    if(this.inputsService.isEdit){
      this.inputsService.resetInput();
      this.inputsService.isEdit = false;
    }
  }

  updateQuantityProduct(event : any, product : Product){
    let newQuantity = 0;
    if(event.value > 99999999999999){
      event.value = 99999999999999;
    }
    if(event.value !== null){
      newQuantity = event.value;
    }
    product.quantity = newQuantity;
    this.inputsService.updateDetailShopping(product, true, true);  
  }

  confirmInput() {
    if (!this.inputsService.providerSelect()) {
      Swal.fire({
        title: '',
        text: 'Debe seleccionar un proveedor antes de continuar.',
        icon: 'error',
        customClass: { container: 'swal-alert' }
      });
      return;
    }
    const hasZeroQuantity = this.inputsService.detailShopping().some(product => !product.quantity || Number(product.quantity) <= 0);
    if (hasZeroQuantity) {
      Swal.fire({
        title: 'Error de validación',
        text: 'No se puede registrar compras con cantidad 0 o menor.',
        icon: 'error',
        customClass: { container: 'swal-alert' }
      });
      return;
    }
    this.inputsService.showModalSaveInput = true;
  }

  updateCostProduct(event : any, product : Product) {
    let newCost = 0;
    if(event.value > 99999999999999){
      event.value = 99999999999999;
    }
    if(event.value !== null){
      newCost = event.value;
    }
    product.costo = newCost;
    this.inputsService.updateDetailShopping(product, false);
  }
  
  async deleteProductForDetailShopping(product: Product) : Promise<void> {
    const confirmation = await Swal.fire({
      title: '¿Quitar producto?',
      text: `Se quitará ${product.name} de la lista de esta compra.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Quitar producto',
      cancelButtonText: 'Mantener producto',
      reverseButtons: true,
      customClass: { container: 'swal-alert' }
    });
    if (!confirmation.isConfirmed) return;

    this.inputsService.detailShopping.update((details)=> {
      const newProducts = details.filter(item => item.id !== product.id);
      return newProducts;
    }); 
  }

  async clearDetailShopping() : Promise<void> {
    if (this.inputsService.isEdit) {
      const confirmation = await Swal.fire({
        title: '¿Descartar los cambios?',
        text: 'La compra seguirá como estaba. Los cambios de esta edición no se guardarán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Salir sin guardar',
        cancelButtonText: 'Seguir editando',
        reverseButtons: true,
        customClass: { container: 'swal-alert' }
      });
      if (!confirmation.isConfirmed) return;
      this.inputsService.isEdit = false;
      this.inputsService.dataInputForEdit.set(undefined);
      this.inputsService.resetInput();
      await this.router.navigateByUrl('/inputs/query-inputs');
      return;
    }
    this.inputsService.resetInput();
  }

  openModalUpdateMontoSus($event:any,product : Product) : void {
    if(!$event.target.value) return; //evitar dbl click en increments btns inputNumber
    this.componentsService.setShowModalBsSus = true; 
    this.product_temp.set(product);
  }

  showUpdateBs(cambio:number){
    if(this.product_temp()){
      const product = this.product_temp();
      product!.costo = cambio;
      this.inputsService.updateDetailShopping(product!, false);
      this.product_temp.set(undefined);
    }
  }
}
