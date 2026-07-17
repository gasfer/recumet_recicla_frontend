import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { OutputService } from '../../../services/output.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';
import { ComponentsService } from 'src/app/core/services/components.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-table-output-details',
  templateUrl: './table-output-details.component.html',
  styles: []
})
export class TableOutputDetailsComponent implements OnDestroy {
  outputService     = inject(OutputService);
  validatorsService = inject(ValidatorsService);
  componentsService = inject(ComponentsService);
  totalSummary      = computed(() => this.outputService.detailSale().reduce((sum, product) => Number(sum) + Number(product.import), 0));
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  product_temp  = signal<Product|undefined>(undefined);

  ngOnDestroy(): void {
    if (this.outputService.isEdit) {
      this.outputService.resetOutput();
      this.outputService.isEdit = false;
    }
  }

  // ✅ Validar stock antes de abrir modal
  onClickRegistrar(): void {
    if (!this.outputService.isEdit) {
      const exceeds = this.outputService.detailSale().filter(
        prod => prod.quantity > prod.total_stock!
      );

      if (exceeds.length > 0) {
        const list = exceeds
          .map(p => `• ${p.name}: ingresado ${p.quantity}, disponible ${p.total_stock}`)
          .join('\n');

        Swal.fire({
          title: 'Stock insuficiente',
          text: list,
          icon: 'warning',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
        return;
      }
    }

    this.outputService.showModalSaveInput = true;
  }

  updateQuantityProduct(event: any, product: Product) {
    if (event.value === null) return;
    product.quantity = event.value;
    product.import = event.value * product.price_select!;
    this.outputService.updateDetailSale(product, true, true);
  }

  updatePriceProduct(event: any, product: Product) {
    if (event.value === null) return;
    product.price_select = event.value;
    this.outputService.updateDetailSale(product, false);
  }

  deleteProductForDetailSale(idProduct: number): void {
    this.outputService.detailSale.update((details) =>
      details.filter(product => product.id !== idProduct)
    );
  }

  openModalUpdateMontoSus($event: any, product: Product): void {
    if (!$event.target.value) return;
    this.componentsService.setShowModalBsSus = true;
    this.product_temp.set(product);
  }

  showUpdateBs(cambio: number) {
    if (this.product_temp()) {
      const product = this.product_temp();
      product!.price_select = cambio;
      this.outputService.updateDetailSale(product!, false);
      this.product_temp.set(undefined);
    }
  }

  returnPricesProduct(product: Product): string {
    return [...product.prices.map(resp => resp.price)].join(', ');
  }

  clearDetailSale(): void {
    this.outputService.resetOutput();
  }
}
