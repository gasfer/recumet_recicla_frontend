import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProductsService } from '../../../services/products.service';
import { Subscription } from 'rxjs';
import { Product } from '../../../interfaces/products.interface';
import { DetailsInputs } from '../../../interfaces/provider-products.interface';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { DecimalPipe } from '@angular/common';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-modal-providers-product',
  templateUrl: './modal-providers-product.component.html',
  styles: [
  ]
})
export class ModalProvidersProductComponent implements OnInit, OnDestroy {
  productsService   = inject(ProductsService);
  validatorsService = inject(ValidatorsService);
  viewProviderSubs$!: Subscription;
  product?: Product;
  pipeNumber        = new DecimalPipe('en-US');
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  loading          = signal(false);
  providersProduct = signal<DetailsInputs | undefined>(undefined);
  rows    = signal(50);
  page    = signal(1);
  type    = signal('');
  query   = signal('');
  fieldSort = signal('');
  order     = signal('');
  cols = signal<ColsTable[]>([
    { field: 'input.date_voucher', header: 'FECHA' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
    { field: `input.provider.full_names`, header: 'NOMBRE' , style:'min-width:200px;max-width:200px;', tooltip: true , isText: true },
    { field: `cost`, header: 'COSTO' , style:'min-width:100px;max-width:100px;',tooltip: true,
      isTag:true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
     },
  ]);
  
  ngOnInit(): void {
    this.viewProviderSubs$ = this.productsService.viewProviderSubs.subscribe(resp => {
      this.product = resp;
      this.getAllAndSearchProducts(1,this.rows());
    });
  }


  getAllAndSearchProducts(page: number, limit: number,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.productsService.getAllAndSearchProviderProduct(page,limit,this.product!.id,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.providersProduct.set(resp.detailsInput);
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchProducts(this.page(),this.rows(),this.type(),this.query())
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchProducts(1,this.rows(),this.type(),this.query());
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  ngOnDestroy(): void {
    this.viewProviderSubs$.unsubscribe();
  }

}
