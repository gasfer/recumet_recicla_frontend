import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ProductsService } from '../../inventories/services/products.service';
import { TransfersService } from '../services/transfers.service';
import { ComponentsService } from 'src/app/core/services/components.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';
import { Product } from '../../inventories/interfaces/products.interface';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styles: [`
  .card {
    border-radius: 20px;
    box-sizing: border-box;
  }
`
  ]
})
export class TransferComponent implements OnInit {
  fb                = inject( FormBuilder  );
  productService    = inject( ProductsService );
  transfersService  = inject( TransfersService );
  componentService  = inject( ComponentsService );
  validatorsService = inject(ValidatorsService);

  suggestedProducts     = signal<Product[]>([]);
  txtSearchProduct      = signal('');
  loadingSearchProduct  = signal(false);
  
  totalItems            = computed(() => this.transfersService.detailTransfer().length);

  formReport:UntypedFormGroup = this.fb.group({
    id_sucursal: ['',[Validators.required]],
    id_storage: ['',[Validators.required]],
  });

  ngOnInit(): void {
    const id_storage_tras  = localStorage.getItem('id_storage_tras');
    const findStorage = this.validatorsService.storages().find(resp => resp.id === Number(id_storage_tras));
    this.formReport.patchValue({
      id_sucursal: this.validatorsService.id_sucursal(),
      id_storage: findStorage ? Number(id_storage_tras) : null
    });
    this.formReport.markAllAsTouched();
  }

  suggestedProduct(txtSearchProduct: string){
    if(txtSearchProduct.length==0) {
      this.txtSearchProduct.set('');
      this.suggestedProducts.set([]);
      return;
    }
    this.loadingSearchProduct.set(true);
    this.txtSearchProduct.set(txtSearchProduct);
    this.suggestedProducts.set([]);
    this.productService.getAllAndSearch(1,1000,true,'pos',txtSearchProduct,true,this.formReport.get('id_sucursal')?.value,this.formReport.get('id_storage')?.value)
        .subscribe({
          next: (resp) => {
            this.suggestedProducts.set(resp.products.data);
            this.loadingSearchProduct.set(false);
            if(this.transfersService._transferConfig.searchForCode){
              this.addItemCar(this.suggestedProducts()[0]);
              this.componentService.clearInputSearch$.next(true);
            }
          },
          error: (e) => {
            this.loadingSearchProduct.set(false);
          }
        });
  }

  addItemCar(product:Product) {
    if(!this.validateStockAndStorage(product)) return;
    this.transfersService.updateDetailSale(product);
    if(this.transfersService._transferConfig.clearInputAfterProductSearch){
      this.componentService.clearInputSearch$.next(true);
    }
  }

  addItemCarByViewProduct(product:Product) {
    if(!this.validateStockAndStorage(product)) return;
    this.transfersService.updateDetailSale(product);
  }

  addItemCarByCodProduct(product:Product) {
    if(this.transfersService._transferConfig.searchForCode){
      if(!this.validateStockAndStorage(product)) return;
      this.addItemCar(product);
      this.componentService.clearInputSearch$.next(false);
    }
  }

  validateStockAndStorage(product:Product) {
    this.formReport.markAllAsTouched();
    if(this.formReport.invalid){
      Swal.fire({ 
        title: 'Ops, Para ingresar productos!', 
        text: `Selecciona una sucursal y un almacén.`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
      return false;
    }
    if(product.total_stock! < 0.1) {
      Swal.fire({ 
        title: 'Ops, Stock insuficiente', 
        text: `No podemos continuar por que no tienes stock, prueba con otra sucursal o almacén.`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
      return false;
    }   
    return true; 
  }

  setSelectStorage() {
    const id_storage = this.formReport.get('id_storage')?.value;
    if(id_storage){
      localStorage.setItem('id_storage_tras', id_storage);
    }
    this.transfersService.resetTransfer();
  }
}
