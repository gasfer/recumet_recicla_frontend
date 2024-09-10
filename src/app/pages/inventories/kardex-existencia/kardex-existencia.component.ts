import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../inputs/services/providers.service';
import { FormSearchKardex, Kardex, Kardexes } from '../interfaces/kardex.interface';
import { KardexService } from '../services/kardex.service';
import * as moment from 'moment';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import Swal from 'sweetalert2';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-kardex-existencia',
  templateUrl: './kardex-existencia.component.html',
  styles: [`
    .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class KardexExistenciaComponent implements OnInit{
  fb                    = inject( FormBuilder);
  validatorsService     = inject( ValidatorsService);
  providersService      = inject( ProvidersService);
  kardexService         = inject( KardexService );
  productService        = inject( ProductsService );
  activatedRoute        = inject( ActivatedRoute );
  providers             = signal<{name:string, code:string}[]>([]);
  loading               = signal(false);
  rows                  = signal(50);
  page                  = signal(1);
  type                  = signal('');
  query                 = signal('');
  kardexes              = signal<Kardexes|undefined>(undefined);
  loadingSearchProduct  = signal(false);
  suggestedProducts     = signal<Product[]>([]);
  productSelect         = signal<Product|undefined>(undefined);
  pipeNumber            = new DecimalPipe('en-US');
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
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
    },
    { 
      label: 'ENTRADAS', icon: 'fa-solid fa-arrow-left', 
      iconStyle: { 'color': '#14A44D'},
      command: () => {
        this.paramsSearch().type_kardex = 'INPUT';
        this.getAllAndSearchKardex(1,this.rows());
      } 
    },
    { 
      label: 'SALIDAS', icon: 'fa-solid fa-arrow-right', 
      iconStyle: { 'color': '#DC4C64'},
      command: () => {
        this.paramsSearch().type_kardex = 'OUTPUT';
        this.getAllAndSearchKardex(1,this.rows());
      } 
    },
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
    { field: 'date', header: 'FECHA' , style:'min-width:90px;max-width:90px;', tooltip: true, isDate: true, isNotDateAndHour:true},
    { field: `document`, header: 'N°' , style:'min-width:80px;max-width:100px;', tooltip: true,  isTag: true,
      tagValue: (val:string)=>  val ? val : '-',
      tagColor: (val:number)=> 'success',
      tagIcon: (val:number)=>  'fa-solid fa-file'
    },
    { field: `detallePrimary`,field2: 'detalle', header: 'DETALLE' , style:'min-width:180px;max-width:200px;', tooltip: true, isDoubleValue:true  },
    { field: `quantity_input`, header: 'ENTRADA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true  },
    { field: `quantity_output`, header: 'SALIDA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true  },
    { field: `quantity_saldo`, header: 'SALDO' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true  },
    
    { field: `cost_u_input`, header: 'P.U.' , style:'min-width:90px;max-width:100px;text-align: center;', tooltip: true, isTag: true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
    
    { field: `cost_u_input`, header: 'ENTRADA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },
    
    { field: `cost_u_output`, header: 'SALIDA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true ,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
     },
    { field: `cost_u_saldo`, header: 'SALDO' , style:'min-width:90px;max-width:100px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),

      },
    { field: `storage.name`, header: 'ALMACÉN' , style:'min-width:100px;max-width:120px;', tooltip: true, isText:true  },
  ]);
  fieldSort = signal('date');
  order     = signal('ASC');

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      const {p:id_product} = params;
      this.findProduct(id_product);
    })
    this.getAllProviders();
  }

  getAllAndSearchKardex(page: number, limit: number,type: string = '', query: string = '') {
    if(!this.productSelect()) return;
    this.formReport.patchValue({id_sucursal:this.validatorsService.id_sucursal()});
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(!query) {this.loading.set(true);} //not loading in search
    this.kardexService.getAllAndSearchKardex(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.kardexes.set(resp.kardexes);
        this.kardexes()?.data.map((resp) => {
          const {cost_price,detallePrimary} = this.returnDetailsPrimary(resp);
          resp.cost_price = cost_price; 
          resp.detallePrimary = detallePrimary; 
        })
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  returnDetailsPrimary(kardex:Kardex) :{cost_price:string,detallePrimary:string} {
    let detallePrimary = '';
    let cost_price ='';
    if(kardex.type == 'INPUT') {
      cost_price = `${kardex.cost_u_input}`;
      if(kardex.detalle.includes('CLASIFICACIÓN')) {
        detallePrimary = `${kardex.productClassified?.name ?? '-'}` 
      } else if(kardex.detalle.includes('TRASLADO')){
        detallePrimary = `${kardex.sucursalOriginDestination?.name ?? '-'}` 
      } else {
        detallePrimary = `${kardex.provider?.full_names ?? '-'}` 
      }
    } else {
      cost_price = `${kardex.price_u_inicial}`;
      if(kardex.detalle.includes('CLASIFICACIÓN')) {
        detallePrimary = `${kardex.productClassified?.name ?? '-'}` 
      } else if(kardex.detalle.includes('TRASLADO')){
        detallePrimary = `${kardex.sucursalOriginDestination?.name ?? '-'}` 
      } else {
        detallePrimary = `${kardex?.client?.full_names ?? '-'}`;
      }
    }
    return {cost_price,detallePrimary};
  }

  findProduct(idProduct: string){
    this.productService.getAllAndSearch(1,1000,true,'id',idProduct)
        .subscribe({
          next: (resp) => {
            if(resp.products.data[0]){
              this.selectProduct(resp.products.data[0]);
              this.getAllAndSearchKardex(1,this.rows())
            } 
          },
        });
  }

  selectProduct(product: Product) {
    this.suggestedProducts.set([]);
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
    if(this.fieldSort() === 'detallePrimary'){
      this.fieldSort.set('detalle');
    }
    this.getAllAndSearchKardex(this.page(),this.rows(),this.type(),this.query());
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
        });
      },
      error: (err)=> this.providers.set([])
    });
  }


  printPdfReport() {
    if(!this.productSelect()) return;
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.kardexService.getReportPdfExistencia(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
    if(!this.productSelect()) return;
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.kardexService.getReportExcelExistencia(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
