import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ProductsService } from '../../inventories/services/products.service';
import { ClassifiedService } from '../services/classified.service';
import { ComponentsService } from 'src/app/core/services/components.service';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Product } from '../../inventories/interfaces/products.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-classified',
  templateUrl: './classified.component.html',
  styles: [
  ]
})
export class ClassifiedComponent implements OnInit {
  fb                = inject( FormBuilder  );
  productService    = inject( ProductsService );
  classifiedService = inject( ClassifiedService );
  componentService  = inject( ComponentsService );
  sucursalService   = inject( SucursalesService );
  authService       = inject( AuthService);
  validatorsService = inject(ValidatorsService);

  suggestedProducts           = signal<Product[]>([]);
  suggestedProductsClassified = signal<Product[]>([]);
  txtSearchProduct            = signal('');
  txtSearchProductClassified  = signal('');
  loadingSearchProduct        = signal(false);
  loadingSearchProductClassified  = signal(false);
  loadingSucursales     = signal(true);
  
  totalItems            = computed(() => this.classifiedService.detailSale().length);
  productSelect         = computed(() => this.classifiedService.productSelect());

  formReport:UntypedFormGroup = this.fb.group({
    id_sucursal: [this.validatorsService.id_sucursal(),[Validators.required]],
    id_storage: ['',[Validators.required]],
  });

  ngOnInit(): void {
    let id_storage_classified  = localStorage.getItem('id_storage_classified');
    if(id_storage_classified){
      this.formReport.get('id_storage')?.setValue(Number(id_storage_classified));
      this.formReport.markAllAsTouched();
    }
  }

  setSuggestedProducts(txtSearchProduct: string){
    if(txtSearchProduct.length==0) {
      this.txtSearchProduct.set('');
      this.suggestedProducts.set([]);
      return;
    }
    this.loadingSearchProduct.set(true);
    this.txtSearchProduct.set(txtSearchProduct);
    this.suggestedProducts.set([]);
    this.productService.getAllAndSearch(1,1000,true,'pos',txtSearchProduct,true,this.formReport.get('id_sucursal')?.value, this.formReport.get('id_storage')?.value)
        .subscribe({
          next: (resp) => {
            this.suggestedProducts.set(resp.products.data);
            this.loadingSearchProduct.set(false);
          },
          error: (e) => {
            this.loadingSearchProduct.set(false);
          }
        });
  }

  selectProduct(product: Product) {
    if(product.total_stock! < 1) {
      Swal.fire({ 
        title: 'Ops, Stock insuficiente', 
        text: `${product.name} no tiene stock, prueba con otra sucursal o almacén.`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
      return;
    }
    this.suggestedProducts.set([]);
    this.txtSearchProduct.set('');
    this.componentService.clearInputSearch$.next(true);
    this.classifiedService.resetClassified();
    this.classifiedService.productSelect.set(product);
  }

  newProduct() {
    this.productService.showModal = true;
  }

  suggestedProductClassifieds(txtSearchProduct: string){
    if(txtSearchProduct.length==0) {
      this.txtSearchProductClassified.set('');
      this.suggestedProductsClassified.set([]);
      return;
    }
    this.loadingSearchProductClassified.set(true);
    this.txtSearchProductClassified.set(txtSearchProduct);
    this.suggestedProductsClassified.set([]);
    this.productService.getAllAndSearch(1,1000,true,'pos',txtSearchProduct,this.formReport.get('id_sucursal')?.value, this.formReport.get('id_storage')?.value)
        .subscribe({
          next: (resp) => {
            this.suggestedProductsClassified.set(resp.products.data);
            this.loadingSearchProductClassified.set(false);
            if(this.classifiedService._classifiedConfig.searchForCode){
              this.addItemCar(this.suggestedProductsClassified()[0]);
              this.componentService.clearInputSearch$.next(true);
            }
          },
          error: (e) => {
            this.loadingSearchProductClassified.set(false);
          }
        });
  }

  addItemCar(product:Product) {
    if(!this.validateProductAndStorage(product)) return;
    this.classifiedService.updateDetailSale(product);
    if(this.classifiedService._classifiedConfig.clearInputAfterProductSearch){
      this.componentService.clearInputSearch$.next(true);
    }
  }

  addItemCarByViewProduct(product:Product) {
    if(!this.validateProductAndStorage(product)) return;
    this.classifiedService.updateDetailSale(product);
  }

  addItemCarByCodProduct(product:Product) {
    if(this.classifiedService._classifiedConfig.searchForCode){
      if(!this.validateProductAndStorage(product)) return;
      this.addItemCar(product);
      this.componentService.clearInputSearch$.next(false);
    }
  }

  validateProductAndStorage(productClassified:Product) {
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
    if(!this.productSelect()){
      Swal.fire({ 
        title: 'Ops, Selecciona producto a clasificar', 
        text: `No podemos ingresar productos, selecciona el producto principal.`,
        icon: 'warning', 
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert'},
      })
      return false;
    }
    if(productClassified.id! == this.productSelect()?.id) {
      Swal.fire({ 
        title: 'Ops, No puedes clasificar el producto', 
        text: `No podemos ingresar el mismo producto seleccionado en el producto principal clasificado.`,
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
      localStorage.setItem('id_storage_classified', id_storage);
    }
    this.classifiedService.resetClassified();
  }
}
