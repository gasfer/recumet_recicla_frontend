import { Component, computed, inject, signal } from '@angular/core';
import { TransfersService } from '../../../services/transfers.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';

@Component({
  selector: 'app-table-transfer-details',
  templateUrl: './table-transfer-details.component.html',
  styles: [
  ]
})
export class TableTransferDetailsComponent  {
  transfersService     = inject( TransfersService );
  validatorsService    = inject( ValidatorsService );
  totalSummary         = computed(() => this.transfersService.detailTransfer().reduce( (sum, product) => Number(sum) + Number(product.import),0));
  decimalLength        = signal(this.validatorsService.decimalLength());
  decimal              = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);


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
    this.transfersService.updateDetailSale(product, true, true);  
  }

  updatePriceProduct(event : any, product : Product) {
    product.price_select = event.target.value;
    this.transfersService.updateDetailSale(product, false);
  }
  
  deleteProductForDetailSale(idProduct: number) : void {
    this.transfersService.detailTransfer.update((details)=> {
      const newProducts = details.filter(product => product.id !== idProduct);
      return newProducts;
    }); 
  }

  clearDetailSale() : void {
    this.transfersService.resetTransfer();
  }
}
