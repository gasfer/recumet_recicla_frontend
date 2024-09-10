import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { OutputService } from '../../../services/output.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';
import { ComponentsService } from 'src/app/core/services/components.service';

@Component({
  selector: 'app-table-output-details',
  templateUrl: './table-output-details.component.html',
  styles: [
  ]
})
export class TableOutputDetailsComponent implements OnDestroy {
  outputService     = inject( OutputService );
  validatorsService = inject( ValidatorsService );
  componentsService = inject( ComponentsService );
  totalSummary      = computed(() => this.outputService.detailSale().reduce( (sum, product) => Number(sum) + Number(product.import),0));
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  product_temp  = signal<Product|undefined>(undefined);

  ngOnDestroy(): void {
    if(this.outputService.isEdit){
      this.outputService.resetOutput();
      this.outputService.isEdit = false;
    }
  }

  updateQuantityProduct(event : any, product : Product){
    let quantity = 0;
    if(event.value > product.total_stock!){
      event.value = product.total_stock!;
      product.quantity = product.total_stock!;
    }
    if(event.value !== null){
      quantity = event.value;
    }
    product.quantity = quantity;
    this.outputService.updateDetailSale(product, true, true);  
  }

  updatePriceProduct(event : any, product : Product) {
    // product.price_select = event.target.value;//select
    product.price_select = event.value;
    this.outputService.updateDetailSale(product, false);
  }
  
  deleteProductForDetailSale(idProduct: number) : void {
    this.outputService.detailSale.update((details)=> {
      const newProducts = details.filter(product => product.id !== idProduct);
      return newProducts;
    }); 
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
          price_select: cambio,
        };
      });
      this.outputService.updateDetailSale(this.product_temp()!, false);
      this.product_temp.set(undefined);
    }
  }

  returnPricesProduct(product:Product) : string {
    return  [...product.prices.map(resp => resp.price)].join(', ');
  }

  clearDetailSale() : void {
    this.outputService.resetOutput();
  }
}
