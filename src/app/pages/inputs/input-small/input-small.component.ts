import { Component, computed, inject, signal } from '@angular/core';
import { Provider } from '../interfaces/provider.interface';
import { ProvidersService } from '../services/providers.service';
import { ComponentsService } from 'src/app/core/services/components.service';
import { InputsService } from '../services/inputs.service';
import { ProductsService } from '../../inventories/services/products.service';
import { Product } from '../../inventories/interfaces/products.interface';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-input-small',
  templateUrl: './input-small.component.html',
  styles: [`
    .card {
      border-radius: 20px;
      box-sizing: border-box;
    }
  `
  ]
})
export class InputSmallComponent  {
  providerService  = inject( ProvidersService );
  productService   = inject( ProductsService );
  inputsService    = inject( InputsService );
  componentService = inject( ComponentsService );
  validatorsService = inject( ValidatorsService );
  suggestedProviders    = signal<Provider[]>([]);
  suggestedProducts     = signal<Product[]>([]);
  txtSearchProvider     = signal('');
  txtSearchProduct      = signal('');
  loadingSearchProvider = signal(false);
  loadingSearchProduct  = signal(false);
  totalItems            = computed(() => this.inputsService.detailShopping().length);
  providerSelect        = computed(() => this.inputsService.providerSelect());
  providerSelectName    = computed(() => `${this.inputsService.providerSelect()?.number_document ?? '0'} / ${this.providerSelect()?.full_names}`);
  
  suggestedProvider(txtSearchProvider: string){
    if(txtSearchProvider.length==0) {
      this.txtSearchProvider.set('');
      this.suggestedProviders.set([]);
      return;
    }
    this.loadingSearchProvider.set(true);
    this.txtSearchProvider.set(txtSearchProvider);
    this.suggestedProviders.set([]);
    this.providerService.getAllAndSearch(1, 1000, true, 'pos' ,txtSearchProvider)
        .subscribe({
          next: (resp) => { 
            this.suggestedProviders.set(resp.providers.data);
            this.loadingSearchProvider.set(false);
          },
          error: (err) => {
            this.loadingSearchProvider.set(false);
          }
        });    
  }

  selectProvider(provider: Provider) {
    this.suggestedProviders.set([]);
    this.txtSearchProvider.set('');
    this.componentService.clearInputSearch$.next(true);
    this.inputsService.providerSelect.set(provider);
  }

  newProvider() {
    this.providerService.showModal = true;
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
    this.productService.getAllAndSearch(1,1000,true,'pos',txtSearchProduct)
        .subscribe({
          next: (resp) => {
            this.suggestedProducts.set(resp.products.data);
            this.loadingSearchProduct.set(false);
            if(this.inputsService._inputConfig.searchForCode){
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
    this.inputsService.updateDetailShopping(product);
    if(this.inputsService._inputConfig.clearInputAfterProductSearch){
      this.componentService.clearInputSearch$.next(true);
    }
  }

  addItemCarByViewProduct(product:Product) {
    this.inputsService.updateDetailShopping(product);
  }
  addItemCarByCodProduct(product:Product) {
    if(this.inputsService._inputConfig.searchForCode){
      this.addItemCar(product);
      this.componentService.clearInputSearch$.next(false);
    }
  }
}
