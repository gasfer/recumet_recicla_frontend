import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormSearchInputs, Input, Inputs } from '../interfaces/input.interface';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { InputsService } from '../services/inputs.service';
import * as moment from 'moment';
import { ProvidersService } from '../services/providers.service';
import Swal from 'sweetalert2';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-query-inputs',
  templateUrl: './query-inputs.component.html',
  styles: [`
    .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class QueryInputsComponent implements OnInit {
  fb                = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  inputsService     = inject(InputsService);
  providersService  = inject(ProvidersService);
  router            = inject(Router);
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
      label: 'Al Contado', icon: 'fa-solid fa-circle-check',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        this.cols()[0].isLink = false;
        this.paramsSearch().type_pay = 'CONTADO';
        this.paramsSearch().status = 'ACTIVE';
        this.getAllAndSearchInputs(1,this.rows());
      }
    },
    { 
      label: 'A Crédito', icon: 'fa-solid fa-clock-rotate-left', 
      iconStyle: { 'color': '#14A44D'},
      command: () => {
        this.cols()[0].isLink = true;
        this.cols()[0].link = '/accounts/accounts-payable?c=${value}';
        this.cols()[0].field2 = 'cod';
        this.cols()[0].tooltipMsg = 'Ver cuenta';
        this.paramsSearch().type_pay = 'CREDITO';
        this.paramsSearch().status = 'ACTIVE';
        this.getAllAndSearchInputs(1,this.rows());
      } 
    },
    { 
      label: 'Anulados', icon: 'fa-solid fa-trash-can', 
      iconStyle: { 'color': '#DC4C64'},
      command: () => {
        this.cols()[0].isLink = false;
        this.paramsSearch().type_pay = '';
        this.paramsSearch().status = 'INACTIVE';
        this.getAllAndSearchInputs(1,this.rows());
      } 
    },
  ]);
  types_registry = computed(() => this.inputsService.types_registry());
  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['MONTH'],
    dates: [new Date(), [Validators.required]],
    type_registry: [''],
    id_sucursal: ['',[Validators.required]],
    id_storage: [''],
    id_provider: [''],
    type_pay: [''],
    status: ['ACTIVE']
  });
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'CÓDIGO' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: 'type_registry', header: 'TIPO DOC.' , style:'min-width:100px;max-width:120px;', tooltip: true,isTag: true, 
      tagValue: (val:boolean)=>  val,
      tagColor: (val:boolean)=> 'success',
      tagIcon: (val:boolean)=>  'fa-solid fa-file'
    },
    { field: 'createdAt', header: 'FECHA CMP.' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
    { field: `provider.full_names`, header: 'PROVEEDOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
    { field: `comments`, header: 'OBSERVACIONES' , style:'min-width:100px;max-width:250px;', tooltip: true, isText: true  },
    { field: `total`, header: 'TOTAL' , style:'min-width:100px;max-width:100px;', tooltip: true, isTag: true, 
      tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
    { field: 'user.full_names', header: 'USUARIO' , style:'min-width:100px;max-width:180px;', tooltip: true, isText: true},
    { field: 'storage.name', header: 'ALMACÉN' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
    { field: 'options', header: 'OPCIONES', style:'min-width:170px;max-width:170px', isButton:true }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'CÓDIGO', code: 'cod'},
    {name: 'NUMBER DOC.', code: 'registry_number'},
    {name: 'COMENTARIOS', code: 'comments'},
    {name: 'BALANZA', code: 'scale.name'},
    {name: 'USUARIO', code: 'user.full_names'},
  ]);
  loading      = signal(false);
  rows         = signal(50);
  page         = signal(1);
  type         = signal('');
  query        = signal('');
  fieldSort    = signal('');
  order        = signal('');
  inputs       = signal<Inputs|undefined>(undefined);
  providers    = signal<{name:string, code:string}[]>([]);
  paramsSearch = signal<FormSearchInputs>({
    type_registry: '',
    id_provider:'',
    type_pay: 'CONTADO',
    id_storage: '',
    id_sucursal: '',
    status: 'ACTIVE',
    filterBy:'MONTH',
    date1: '',
    date2: ''
  });
  types_filtrado = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);

  ngOnInit(): void {
    this.getAllProviders();
    this.getAllAndSearchInputs(1,this.rows());
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
  
  getAllAndSearchInputs(page: number, limit: number,type: string = '', query: string = '') {
    this.formReport.get('id_sucursal')?.setValue(this.validatorsService.id_sucursal());
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(!query) {this.loading.set(true);} //not loading in search
    this.inputsService.getAllAndSearchInputs(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.inputs.set(resp.inputs);
        this.inputs()!.data.forEach((input) => {
          input.options = input.status == 'ACTIVE'  ? [
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver detalle',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => {
                this.inputsService.detailsSubs$.next(input);
                this.inputsService.showModalDetailsInput = true;
              }
            },
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('COMPRAS','update'),
              class:'p-button-rounded p-button-warning p-button-sm  ms-1',
              eventClick: () => {
                this.inputsService.resetInput();
                this.inputsService.isEdit = true;
                input.detailsInput.forEach(resp => {
                  this.inputsService.detailShopping.update((details) => [
                    ...details,
                    {
                      id: resp.product.id,
                      cod: resp.product.cod,
                      costo: Number(resp.cost),
                      quantity: Number(resp.quantity),
                      import: Number(resp.total),
                      category: resp.product.category,
                      unit: resp.product.unit,
                      description: resp.product.description,
                      id_category: resp.product.category.id,
                      id_unit: resp.product.unit.id,
                      img: resp.product.img,
                      name: resp.product.name,
                      inventariable: resp.product.inventariable,
                      status: true,
                      prices: [],
                    },
                  ]);
                }); 
                this.inputsService.providerSelect.set(input.provider);
                this.inputsService.dataInputForEdit.set(input);
                this.router.navigateByUrl('/inputs/input-small');
              }
            },
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Imprimir',
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.inputsService.printPdfReport(input.id);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Anular',
              disabled: this.validatorsService.withPermission('COMPRAS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.anularInput(input);
              }
            },
          ] : [
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver detalle',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => {
                this.inputsService.detailsSubs$.next(input);
                this.inputsService.showModalDetailsInput = true;
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  anularInput(input: Input) {
    Swal.fire({
      title: `¿Esta seguro de anular Compra?`,
      text: `Esta apunto de anular la compra: ${input.cod} - ${input.registry_number}`,
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
          this.inputsService.deleteInput(input.id).subscribe({
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
        this.getAllAndSearchInputs(1,this.rows());
        Swal.fire({ 
          title: 'Éxito!', 
          text: `La compra fue anulada correctamente, Disponible en la sección de anulados`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal,id_storage,type_registry, id_provider, dates} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        type_registry: type_registry ? type_registry : '',
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_storage : id_storage ? id_storage : '',
        id_provider: id_provider ? id_provider : '',
        type_pay: params.type_pay,
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
    this.getAllAndSearchInputs(this.page(),this.rows(),this.type(),this.query());
  }

  customSort($sort:any) {
    console.log($sort);
    
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchInputs(1,this.rows(),this.type(),this.query());
  }

  clearInputs() {
    this.formReport.patchValue({
      filterBy: 'DAY',
      dates: new Date(),
      type_registry: '',
      id_provider: '',
      date_range: '',
      type_pay: '',
      status: 'ACTIVE',   
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
          this.inputsService.getReportPdf(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
          this.inputsService.getReportExcel(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
          this.inputsService.getReportDetailsPdf(this.paramsSearch()).subscribe({
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
          this.inputsService.getReportDetailsExcel(this.paramsSearch()).subscribe({
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
