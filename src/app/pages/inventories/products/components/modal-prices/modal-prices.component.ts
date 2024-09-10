import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import { Subscription } from 'rxjs';
import { Price, Product } from '../../../interfaces/products.interface';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-prices',
  templateUrl: './modal-prices.component.html',
  styles: [
  ]
})
export class ModalPricesComponent implements OnInit, OnDestroy {
  productsService = inject(ProductsService);
  isPricesSub$!: Subscription;
  product?: Product;
  prices = signal<{data:Price[],status:boolean}>({data: [],status:true});
  cols = signal<ColsTable[]>([
    { field: 'name', header: 'NOMBRE' , style:'min-width:150px;', tooltip: true},
    { field: `price`, header: 'PRECIO' , style:'min-width:100px;',tooltip: true  },
    { field: `profit_margin`, header: 'MARGE %' , style:'min-width:100px;',tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:80px;max-width:80px', isButton:true,
    }
  ]);

  ngOnInit(): void {
    this.isPricesSub$ = this.productsService.pricesSubs.subscribe(resp => {
      this.product =  {...resp};
      this.product.prices?.forEach(price => {
        price.options = [
          {
            label:'Eliminar',icon:'fa-solid fa-trash-can', 
            tooltip: 'Eliminar',
            class:'p-button-rounded p-button-danger p-button-sm ms-1',
            eventClick: () => {
              this.deletePrice(price);
            }
          },
        ]
      });
      this.prices.set({data: this.product.prices!, status:true});
    });
  }

  ngOnDestroy(): void {
    this.isPricesSub$.unsubscribe();
  }

  deletePrice(price: Price) {
    Swal.fire({
      title: `¿Esta seguro de dar de baja definitivamente?`,
      text: `Esta apunto de Eliminar el precio ${price.name} ${price.price}`,
      icon: 'warning',
      confirmButtonText: `Si, Dar de baja!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.productsService.deletePrice(price.id).subscribe({
            complete: () => resolve(true),
            error: (err) => {
              Swal.showValidationMessage(`Ops...! Lamentablemente no se puedo realizar la solicitud`);
              resolve(false);
            }
          });
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if(!result.isConfirmed) return;
      if(result.value) {
        this.prices().data = this.prices().data.filter(resp => resp.id != price.id);
        this.productsService.save$.next(true);
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Se ha dado de baja al precio`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }
}
