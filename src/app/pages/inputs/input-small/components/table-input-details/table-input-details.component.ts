import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ComponentsService } from 'src/app/core/services/components.service';

@Component({
  selector: 'app-table-input-details',
  templateUrl: './table-input-details.component.html',
  styles: []
})
export class TableInputDetailsComponent implements OnDestroy {
  inputsService       = inject( InputsService );
  validatorsService   = inject( ValidatorsService );
  componentsService   = inject( ComponentsService );
  decimalLength       = signal(this.validatorsService.decimalLength());
  decimal             = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  product_temp        = signal<Product|undefined>(undefined);
  totalSummary        = computed(() => this.inputsService.detailShopping().reduce( (sum, product) => Number(sum) + Number(product.import),0));

  ngOnDestroy(): void {
    if(this.inputsService.isEdit){
      this.inputsService.resetInput();
      this.inputsService.isEdit = false;
    }
  }

  updateQuantityProduct(event : any, product : Product){
    let newQuantity = 0.1;
    if(event.value > 99999999999999){
      event.value = 99999999999999;
    }
    if(event.value !== null){
      newQuantity = event.value;
    }
    product.quantity = newQuantity;
    this.inputsService.updateDetailShopping(product, true, true);  
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
  
  deleteProductForDetailShopping(idProduct: number) : void {
    this.inputsService.detailShopping.update((details)=> {
      const newProducts = details.filter(product => product.id !== idProduct);
      return newProducts;
    }); 
  }

  clearDetailShopping() : void {
    this.inputsService.resetInput();
  }

  openModalUpdateMontoSus($event:any,product : Product) : void {
    if(!$event.target.value) return; //evitar dbl click en increments btns inputNumber
    this.componentsService.setShowModalBsSus = true; 
    this.product_temp.set(product);
  }

  showUpdateBs(cambio:number){
    if(this.product_temp()){
      this.product_temp.update((product) => {
        if (!product) return product;
        return {
          ...product,
          costo: cambio,
        };
      });
      this.inputsService.updateDetailShopping(this.product_temp()!, false);
      this.product_temp.set(undefined);
    }
  }
}
