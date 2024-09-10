import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ClassifiedService } from '../services/classified.service';
import { Router } from '@angular/router';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { AuthService } from 'src/app/auth/auth.service';
import { DecimalPipe } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Classified, Classifieds, FormSearchClassified } from '../interfaces/classified.interface';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { Product } from '../../inventories/interfaces/products.interface';
import { ProductsService } from '../../inventories/services/products.service';

@Component({
  selector: 'app-query-classifieds',
  templateUrl: './query-classifieds.component.html',
  styles: [
  ]
})
export class QueryClassifiedsComponent implements OnInit {
  fb                = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  classifiedService = inject(ClassifiedService);
  router            = inject(Router);
  sucursalService   = inject(SucursalesService);
  authService       = inject(AuthService);
  productService    = inject(ProductsService );

  pipeNumber = new DecimalPipe('en-US');
  minDate!: Date;
  maxDate!: Date;
  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelReport(); }
    },
    {
      label: 'Pdf Detalle',
      icon: 'fas fa-print',
      iconStyle: { 'color': '#DC4C64'},
      command: () => { this.printPdfDetailsReport(); }
    },
    {
      label: 'Excel Detalle',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelDetailsReport(); }
    },
  ];
  searchItems = signal<MenuItem[]>([
    { 
      label: 'Clasificados', icon: 'fa-solid fa-circle-check',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        this.paramsSearch().status = 'ACTIVE';
        this.getAllAndSearchClassifieds(1,this.rows());
      }
    },
    { 
      label: 'Anulados', icon: 'fa-solid fa-trash-can', 
      iconStyle: { 'color': '#DC4C64'},
      command: () => {
        this.paramsSearch().status = 'INACTIVE';
        this.getAllAndSearchClassifieds(1,this.rows());
      } 
    },
  ]);
  types_registry = computed(() => this.classifiedService.types_registry());
  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['DAY'],
    dates: [new Date(), [Validators.required]],
    type_registry: [''],
    id_sucursal: ['',[Validators.required]],
    id_storage: [''],
    id_product: [''],
    type_pay: [''],
    status: ['ACTIVE']
  });
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'CÓDIGO' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: 'type_registry', header: 'TIPO DOC.' , style:'min-width:100px;max-width:100px;', tooltip: true,isTag: true, 
      tagValue: (val:boolean)=>  val,
      tagColor: (val:boolean)=> 'success',
      tagIcon: (val:boolean)=>  'fa-solid fa-file'
    },
    { field: 'number_registry', header: 'N. DOC.' , style:'min-width:90px;max-width:100px;', tooltip: true},
    { field: 'product.name', header: 'PRODUCTO' , style:'min-width:150px;max-width:250px;', tooltip: true, isText: true},
    { field: 'quantity_product', header: 'CANT.' , style:'min-width:90px;max-width:90px;text-align: center;', tooltip: true,isTag: true, 
      tagValue: (val:boolean)=>  val,
      tagColor: (val:boolean)=> 'warning',
      tagIcon: (val:boolean)=>  'fa-solid fa-tag'
    },  
    { field: 'date_classified', header: 'FECHA CL.' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
    { field: `comments`, header: 'OBSERVACIONES' , style:'min-width:100px;max-width:250px;', tooltip: true, isText: true  },
    { field: 'user.full_names', header: 'USUARIO' , style:'min-width:100px;max-width:180px;', tooltip: true, isText: true},
    { field: 'storage.name', header: 'ALMACÉN' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
    { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'CÓDIGO', code: 'cod'},
    {name: 'NUMBER DOC.', code: 'number_registry'},
    {name: 'COMENTARIOS', code: 'comments'},
    {name: 'BALANZA', code: 'scale.name'},
    {name: 'USUARIO', code: 'user.full_names'},
  ]);
  loadingSearchProduct  = signal(false);
  txtSearchProduct      = signal('');
  suggestedProducts     = signal<Product[]>([]);
  productSelect         = signal<Product|undefined>(undefined);
  loading      = signal(false);
  rows         = signal(50);
  page         = signal(1);
  type         = signal('');
  query        = signal('');
  classifieds  = signal<Classifieds|undefined>(undefined);
  paramsSearch = signal<FormSearchClassified>({
    type_registry: '',
    id_product:'',
    id_storage: '',
    id_sucursal: '',
    status: 'ACTIVE',
    filterBy:'DAY',
    date1: '',
    date2: ''
  });
  types_filtrado = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  fieldSort = signal('');
  order     = signal('');

  ngOnInit(): void {
    this.getAllAndSearchClassifieds(1,this.rows());
  }

  
  getAllAndSearchClassifieds(page: number, limit: number,type: string = '', query: string = '') {
    this.formReport.patchValue({id_sucursal:this.validatorsService.id_sucursal()});
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(!query) {this.loading.set(true);} //not loading in search
    this.classifiedService.getAllAndSearchClassifieds(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.classifieds.set(resp.classifieds);
        this.classifieds()!.data.forEach((classified) => {
          classified.options = classified.status == 'ACTIVE'  ? [
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver detalle',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => {
                this.classifiedService.detailsSubs$.next(classified);
                this.classifiedService.showModalDetailsClassified = true;
              }
            },
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Imprimir',
              disabled: this.validatorsService.withPermission('CLASIFICADOS','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.classifiedService.printPdfReport(classified.id);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Anular',
              disabled: this.validatorsService.withPermission('CLASIFICADOS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.destroyClassified(classified);
              }
            },
          ] : [
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver detalle',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => {
                this.classifiedService.detailsSubs$.next(classified);
                this.classifiedService.showModalDetailsClassified = true;
              }
            },
          ] ;
        });
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

  destroyClassified(classified: Classified) {
    Swal.fire({
      title: `¿Esta seguro de anular Clasificado?`,
      text: `Esta apunto de anular la clasificación: ${classified.cod} - ${classified.number_registry}`,
      icon: `warning`,
      confirmButtonText: `Si, Anular!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.classifiedService.deleteClassified(classified.id).subscribe({
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
        this.getAllAndSearchClassifieds(1,this.rows());
        Swal.fire({ 
          title: 'Éxito!', 
          text: `La clasificación fue anulada correctamente, Disponible en la sección de anulados`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal,id_storage,type_registry, id_product, dates} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        type_registry: type_registry ? type_registry : '',
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_storage : id_storage ? id_storage : '',
        id_product: id_product ? id_product : '',
        status: params.status,
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
      }
    });
  }

  onChangeTypesFilter() {
    const type_filter = this.formReport.get('filterBy')?.value;
    if(type_filter == 'RANGE'){
      this.formReport.get('dates')?.setValue([new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchClassifieds(this.page(),this.rows(),this.type(),this.query())
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
    this.getAllAndSearchClassifieds(1,this.rows(),this.type(),this.query());
  }

  clearInputs() {
    this.formReport.patchValue({
      filterBy: 'DAY',
      dates: new Date(),
      type_registry: '',
      id_product: '',
      id_storage: '',
      date_range: '',
      status: 'ACTIVE',   
    });
    this.productSelect.set(undefined);
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
          this.classifiedService.getReportPdf(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
            next: (data) => {
              this.loading.set(false);
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
          this.classifiedService.getReportExcel(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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


  printPdfDetailsReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.classifiedService.getReportDetailsPdf(this.paramsSearch()).subscribe({
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

  printExcelDetailsReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.classifiedService.getReportDetailsExcel(this.paramsSearch()).subscribe({
            next: (data) => {
              this.loading.set(false);
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
