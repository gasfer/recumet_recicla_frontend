import {  Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProductsService } from '../services/products.service';
import { ProductsCosts } from '../interfaces/products-prices.interfaces';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { DecimalPipe } from '@angular/common';
import { ErrorLogsService } from 'src/app/core/services/error-logs.service';
import { CategoriesService } from '../services/categories.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-costs-product',
  templateUrl: './list-costs-product.component.html',
})
export class ListCostsProductComponent implements OnInit {
  validatorsService = inject(ValidatorsService);
  fb                = inject(FormBuilder);
  productsService   = inject(ProductsService);
  errorLogsService  = inject(ErrorLogsService);
  categoriesService = inject(CategoriesService);

  loading   = signal(false);
  rows      = signal(50);
  page      = signal(1);
  type      = signal('');
  query     = signal('');
  fieldSort = signal('');
  order     = signal('');
  productsCosts = signal<ProductsCosts | undefined>(undefined);
  pipeNumber    = new DecimalPipe('en-US');
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  formReport:UntypedFormGroup = this.fb.group({
    id_category: [''],
  });
  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelReport(); }
    }
  ];
  searchItems = signal<MenuItem[]>([
    { 
      label: 'Productos precios', icon: 'fa-solid fa-circle-check',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        //this.getAllAndSearchInputs(1,this.rows());
      }
    },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'COD' , style:'min-width:90px;max-width:90px;', tooltip: true,},
    { field: `name`, header: 'NOMBRE' , style:'min-width:200px;max-width:200px;', tooltip: true , isText: true },
    { field: `description`, header: 'DESCRIPCION' , style:'min-width:150px;max-width:300px;',tooltip: true, isText:true  },
    { field: `productCosts.cost`, header: 'EN EL PUESTO' , style:'min-width:180px;max-width:180px;',tooltip: true,
      isTag:true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
    { field: `productCosts.cost_two`, header: 'CON RECOJO' , style:'min-width:180px;max-width:180px;',tooltip: true,
      isTag:true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
    { field: `productCosts.cost_tree`, header: 'OTRO' , style:'min-width:180px;max-width:180px;',tooltip: true,
      isTag:true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true, activeSortable:false
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRE', code: 'name'},
    {name: 'COD', code: 'cod'},   
    {name: 'DESCRIPCION', code: 'description'},
  ]);
  categories  = signal<{name:string,code:string}[]>([]);

  ngOnInit(): void {
    this.getAllAndSearchProducts(this.page(), this.rows());
    this.getAllCategories();
  }

  getAllCategories() {
    this.categories.set([]);
    this.categoriesService.getAllAndSearch(1,1000,true).subscribe(resp => {
      const formattedCategory = resp.categories.data.map(category => ({
        name: category.name,
        code: category.id!.toString()
      }));
      this.categories.set(formattedCategory);
    });
   
  }

  getAllAndSearchProducts(page: number, limit: number,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    const id_category = this.formReport.get('id_category')?.value;
    this.productsService.getAllAndSearchProductCosts(page,limit,id_category,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.productsCosts.set(resp.products);
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  saveProductCostUpdate(row:any) {
    this.productsService.postNewProductCost(row).subscribe({
      complete:() => {
        this.errorLogsService.notifications('Modificado correctamente','success');
      },
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

  clearInputs() {
    this.formReport.patchValue({
      id_category: '',
    });
  }

  printExcelReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    const id_category = this.formReport.get('id_category')?.value;
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.productsService.getReportProductCostExcel(id_category,this.fieldSort(),this.order()).subscribe({
            next: (data) => {
              const fileURL = window.URL.createObjectURL(data);
              window.open(fileURL);
              Swal.close();
            },
            error: (err) => {
              Swal.close();
            },
          });
        });
      },
    });
  }

  printPdfReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    const id_category = this.formReport.get('id_category')?.value;
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.productsService.getReportProductCostPdf(id_category,this.fieldSort(),this.order()).subscribe({
            next: (data) => {
              const fileURL = window.URL.createObjectURL(data);
              window.open(fileURL);
              Swal.close();
            },
            error: (err) => {
              Swal.close();
            },
          });
        });
      },
    });
  }

}
