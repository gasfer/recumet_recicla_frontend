import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProductsService } from '../../../services/products.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Product } from '../../../interfaces/products.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-new-price',
  templateUrl: './modal-new-price.component.html',
  styles: [
  ]
})
export class ModalNewPriceComponent implements OnInit, OnDestroy{
  loading                 = signal(false);
  validatorsService       = inject( ValidatorsService );
  productsService         = inject( ProductsService);
  fb                      = inject( FormBuilder );
  decimalLength           = signal(this.validatorsService.decimalLength());
  isPricesSub$!: Subscription;
  product?     : Product;
  priceForm: FormGroup = this.fb.group({
    name: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(20),this.validatorsService.isSpacesInDynamicTxt]],
    price: [0, [Validators.required,Validators.min(0)]],
    profit_margin: [0, [Validators.required]],
    id_product: [null, [Validators.required]],
    status: [{value:true, disabled: true}]
  });

  ngOnInit(): void {
    this.isPricesSub$ = this.productsService.pricesSubs.subscribe(resp => {
      this.product =  {...resp};
      this.priceForm.patchValue({
        id_product: resp.id,
      });
      this.calcularPrecio();
      this.calcularMargen();
    });
    // Escuchar cambios en los controles costo y precio
    this.priceForm.get('profit_margin')?.valueChanges.subscribe(() => {
      this.calcularPrecio();
    });
    this.priceForm.get('price')?.valueChanges.subscribe(() => {
      this.calcularMargen();
    });
  }

  ngOnDestroy(): void {
    this.isPricesSub$.unsubscribe();
  }
  newPrice() {
    this.priceForm.markAllAsTouched();
    if(!this.priceForm.valid) return;
    this.loading.set(true);
    this.productsService.postNewPrice({...this.priceForm.value, status: true}).subscribe({
      complete: () => {
        this.productsService.save$.next(true);
        this.loading.set(false);
        this.productsService.showModalNewPrice = false;
        this.productsService.showModalPrices = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Precio agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  calcularPrecio() {
    const costo = Number(this.product!.costo);
    const margen = this.priceForm.get('profit_margin')?.value;
    const precio = this.productsService.calcularPrecio(costo, margen);
    this.priceForm.get('price')?.setValue(precio, { emitEvent: false });
  }

  calcularMargen() {
    const costo = Number(this.product!.costo);
    const precio = this.priceForm.get('price')?.value;
    const margen = this.productsService.calcularMargen(costo, precio);
    this.priceForm.get('profit_margin')?.setValue(margen, { emitEvent: false });
  }

  resetModal() {
    this.productsService.showModalNewPrice = false;
    this.priceForm.reset({
      name: '',
      price: '',
      profit_margin: '',
      id_product: null,
      status: true,
    });
  }
}
