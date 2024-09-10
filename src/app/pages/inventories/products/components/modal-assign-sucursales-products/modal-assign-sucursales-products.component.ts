import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { ProductsService } from '../../../services/products.service';
import { Subscription } from 'rxjs';
import { FormAssignSucursalesProduct, Product, ProductSucursal } from '../../../interfaces/products.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-assign-sucursales-products',
  templateUrl: './modal-assign-sucursales-products.component.html',
  styles: [
  ]
})
export class ModalAssignSucursalesProductsComponent implements OnInit, OnDestroy {
  productsService = inject(ProductsService);
  sucursalService = inject(SucursalesService);
  sucursales = signal<Sucursal[]>([])
  loading    = signal(false);
  loadingSubmit  = signal(false);
  isSucursalSelectSub$!: Subscription;
  product?: Product;
  productSucursals?: ProductSucursal[];

  ngOnInit(): void {
    this.isSucursalSelectSub$ = this.productsService.assignSucursalSubs.subscribe(resp => {
      this.product = resp;
    });
  }

  getProductAndSucursal() {
    this.loading.set(true);
    this.productsService.getOneProductSucursal(this.product!.id).subscribe(resp => {
      this.productSucursals = resp.productSucursals;
      this.getAllSucursales();
    })  
  }

  getAllSucursales() {
    this.sucursalService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp) => this.sucursales.set(resp.sucursales.data), 
      complete: () => {
        this.sucursales().forEach(resp=> resp.select = false);
        this.productSucursals?.forEach((resp)=>{
          const targetIndex =  this.sucursales().findIndex(item => item.id === resp.id_sucursal);
          if (targetIndex !== -1) {
            this.sucursales()[targetIndex].select = true;  // Nuevo valor que deseas asignar
          } 
        });
        this.loading.set(false);
      },
    });
  }
  
  assignSucursal(sucursal: Sucursal) {
    const targetIndex =  this.sucursales().findIndex(item => item.id === sucursal.id);
    if (targetIndex !== -1) {
      this.sucursales()[targetIndex].select = !this.sucursales()[targetIndex].select;  
    } 
  }

  saveAssignSucursales() {
   this.loadingSubmit.set(true);
   const id_product = this.product?.id!;
   if(!id_product) return;
    let sucursalesAssign: FormAssignSucursalesProduct[] = [];
    this.sucursales().forEach(sucursal => {
      if(sucursal.select){
        sucursalesAssign.push({
          id_product: id_product,
          id_sucursal: sucursal.id!,
          status: true
        });
      }
    });
    this.productsService.postNewAssignate(id_product,sucursalesAssign).subscribe({
      next: (resp) => {
        this.productsService.showModalSucursales = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Asignación de sucursales realizada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
        });
        this.loadingSubmit.set(false);
      },
      error: (err) => this.loadingSubmit.set(false)
    })
  }

  ngOnDestroy(): void {
    this.isSucursalSelectSub$.unsubscribe();
  }

}
