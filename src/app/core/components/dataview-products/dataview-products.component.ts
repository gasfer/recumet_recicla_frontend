import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';
import { CategoriesService } from 'src/app/pages/inventories/services/categories.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-dataview-products',
  templateUrl: './dataview-products.component.html',
  styleUrls: ['./dataview-products.component.scss']
})
export class DataviewProductsComponent implements OnInit {
  searchFor              = signal([{name: 'Producto', code: 'pos'},{name: 'Categoría', code: 'id_category'}]); 
  rows      :number      = 50;      
  total     :number      = 0;      
  from      :number      = 0;        
  to        :number      = 0;          
  isSearchByProduct      = signal(true);
  loading                = signal(true);
  @Input() isViewQuantity: boolean = false;
  @Input() isViewPrice: boolean = false;
  @Input() id_sucursal: string = '';
  @Input() id_storage : string = '';
  products          = signal<Product[]>([]);
  categories        = signal<{name:string,code:string}[]>([]);
  productsService   = inject(ProductsService);
  categoriesService = inject(CategoriesService);
  fb                = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  formSearch: UntypedFormGroup = this.fb.group({
    searchSelect: ['pos', [ Validators.required]],
    query:['',]
  });
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  @Output() onProductSelect: EventEmitter<Product> = new EventEmitter();
  @Output() onProductByCod: EventEmitter<Product> = new EventEmitter();

  ngOnInit(): void {
    this.getAllAndSearchProducts(1,this.rows,true);
    this.getAllCategories();
  }

  searchByProduct(txtSearchProduct: string){
    this.formSearch.patchValue({
      searchSelect: 'pos',
      query: txtSearchProduct
    });
    if(txtSearchProduct?.length==0) {
      this.getAllAndSearchProducts(1,this.rows,true);
      return;
    }
    this.getAllAndSearchProducts(1,this.rows,true,'pos',txtSearchProduct);
  }

  searchByCategory(event: any){
    let value = event.value;
    this.formSearch.patchValue({
      searchSelect: 'id_category',
      query: value
    });
    if(!value){
      this.getAllAndSearchProducts(1,this.rows,true);
      return;
    }
    this.getAllAndSearchProducts(1,this.rows,true,'id_category',value);
  }

  getAllAndSearchProducts(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.productsService.getAllAndSearch(page,limit,status,type,query,this.isViewQuantity,this.id_sucursal,this.id_storage).subscribe({
      next: (resp) => {
        this.products.set(resp.products.data);
        this.total = resp.products.total;
        this.from = resp.products.from;
        this.to =resp.products.to;
        if(this.products().length == 1){
          this.onProductByCod.next(this.products()[0]);
        }
       // this.products.sort(((a, b) => b.total_stock - a.total_stock));
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  paginate(event : any) {
    const page = event.page+1;
    this.rows = event.rows;
    const {searchSelect:typeSearch, query:value} = this.formSearch.value;
    if(value){
      this.getAllAndSearchProducts(page,this.rows,true,typeSearch,value);
    } else {
      this.getAllAndSearchProducts(1,this.rows,true);
    }
  }

  getColorStock(total_stock: number, stock_min: number): string {
    return 'red';//this.productService.getColorStock(total_stock, stock_min);
  }

  

  addListDetailPos(product: Product) {
    this.onProductSelect.next(product);
  }

  getAllCategories() {
    this.categories.set([]);
    this.categoriesService.getAllAndSearch(1,1000,true).subscribe(resp => {
      const formattedCategory = resp.categories.data.map(category => ({
        name: category.name,
        code: category.id!.toString()
      }));
      this.categories.set(formattedCategory);
    })
  }

  changeSearchProductBy(event: any): void {
    let value = event.value;
    this.formSearch.patchValue({
      searchSelect: value,
      query: ''
    })
    if(value === 'pos'){
      this.isSearchByProduct.set(true);
    } else {
      this.isSearchByProduct.set(false);
    }
  }
}
