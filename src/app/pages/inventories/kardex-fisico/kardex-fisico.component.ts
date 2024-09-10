import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../inputs/services/providers.service';
import { FormSearchKardex, Kardexes } from '../interfaces/kardex.interface';
import { KardexService } from '../services/kardex.service';
import * as moment from 'moment';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-kardex-fisico',
  templateUrl: './kardex-fisico.component.html',
  styles: [
  ]
})
export class KardexFisicoComponent {
  fb                    = inject( FormBuilder);
  validatorsService     = inject( ValidatorsService);
  providersService      = inject( ProvidersService);
  kardexService         = inject( KardexService );
  productService        = inject( ProductsService );
  providers             = signal<{name:string, code:string}[]>([]);
  loading               = signal(false);
  rows                  = signal(50);
  page                  = signal(1);
  type                  = signal('');
  query                 = signal('');
  kardexes              = signal<Kardexes|undefined>(undefined);
  loadingSearchProduct  = signal(false);
  txtSearchProduct      = signal('');
  suggestedProducts     = signal<Product[]>([]);
  productSelect         = signal<Product|undefined>(undefined);
  paramsSearch      = signal<FormSearchKardex>({
    filterBy:'MONTH',
    date1: '',
    date2: '',
    id_product: '',
    id_provider: '',
    id_storage: '',
    id_sucursal: '',
    type_kardex: ''
  });
  types_filtrado    = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => {
        this.printExcelReport();
      }
    },
  ];
  searchItems = signal<MenuItem[]>([
    { 
      label: 'ENTRADAS Y SALIDAS', icon: 'fa-solid fa-left-right',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        this.paramsSearch().type_kardex = '';
        this.getAllAndSearchKardex(1,this.rows());
      }
    }
  ]);
  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['MONTH'],
    dates: [new Date(), [Validators.required]],
    type_kardex: [''],
    id_sucursal: ['',[Validators.required]],
    id_storage: [''],
    id_provider: [''],
    id_product: ['']
  });
  cols = signal<ColsTable[]>([
  
    { field: 'product.cod', header: 'CÓDIGO' , style:'min-width:100px;max-width:100px;', tooltip: true, isLink:true, link:'/inventories/kardex-existencia?p=${value}', field2:'id_product'},
    { field: `product.name`, header: 'DETALLE' , style:'min-width:180px;max-width:180px;', tooltip: true, isText:true  },
    { field: `product.unit.siglas`, header: 'UND' , style:'min-width:80px;max-width:80px;', tooltip: true, isText:true  },
    { field: `quantity_inicial`, header: 'SALDO INICIAL' , style:'min-width:110px;max-width:120px;text-align: center;', tooltip: true,   },
    { field: `quantity_input`, header: 'ENTRADA' , style:'min-width:100px;max-width:120px;text-align: center;', tooltip: true  },
    { field: `quantity_output`, header: 'SALIDA' , style:'min-width:100px;max-width:120px;text-align: center;', tooltip: true  },
    { field: `quantity_saldo`, header: 'SALDO' , style:'min-width:100px;max-width:120px;text-align: center;', tooltip: true  },
    { field: `storage.name`, header: 'ALMACÉN' , style:'min-width:100px;max-width:120px;', tooltip: true, isText:true  },
  ]);
  fieldSort = signal('product.cod');
  order     = signal('ASC');

  ngOnInit(): void {
    this.getAllProviders();
    this.getAllAndSearchKardex(1,this.rows());
  }

  getAllAndSearchKardex(page: number, limit: number,type: string = '', query: string = '') {
    this.formReport.patchValue({id_sucursal:this.validatorsService.id_sucursal()});
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(!query) {this.loading.set(true);} //not loading in search
    this.kardexService.getAllAndSearchKardexFisico(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.kardexes.set(resp.kardexes);
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
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
          },
          error: (e) => {
            this.loadingSearchProduct.set(false);
          }
        });
  }

  selectProduct(product: Product) {
    this.suggestedProducts.set([]);
    this.txtSearchProduct.set('');
    this.productSelect.set(product);
    this.formReport.get('id_product')?.setValue(this.productSelect()?.id);
  }

  clearSelectProduct() {
    this.productSelect.set(undefined);
    this.formReport.get('id_product')?.setValue(null);
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal, id_provider, id_product ,id_storage, dates} = this.formReport.value;      
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        type_kardex: params.type_kardex,
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_storage : id_storage ? id_storage : '',
        id_provider: id_provider ? id_provider : '',
        id_product : id_product ? id_product : '',
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
      }
    });
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchKardex(this.page(),this.rows(),this.type(),this.query())
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchKardex(1,this.rows(),this.type(),this.query());
  }
  

  onChangeTypesFilter() {
    const type_filter = this.formReport.get('filterBy')?.value;
    if(type_filter == 'RANGE'){
      this.formReport.get('dates')?.setValue([new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  getAllProviders() {
    this.providersService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp)=> {
        this.providers.set([]);
        resp.providers.data.forEach(provider => {
          this.providers.update((providers) => [
            ...providers,
            {
              name: `${provider.full_names} - ${provider.number_document ?? ''}`,
              code: provider.id.toString(),
            },
          ]);
        })
      },
      error: (err)=> this.providers.set([])
    });
  }


  printPdfReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.kardexService.getReportPdfFisico(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
            next: (data) => {
              const file = new Blob([data], { type: 'application/pdf' });
              const fileURL = URL.createObjectURL(file);
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

  printExcelReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.kardexService.getReportExcelFisico(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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

  clearInputs() {
    this.formReport.patchValue({
      filterBy: 'MONTH',
      dates: new Date(),
      date_range: '',
      id_sucursal: '',
      id_provider: '',
      type_kardex: '',
      id_storage: '',  
      id_product: '',  
    });
  }
}
