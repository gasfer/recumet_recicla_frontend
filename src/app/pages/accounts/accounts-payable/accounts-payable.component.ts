import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { ProvidersService } from '../../inputs/services/providers.service';
import { AccountsPayable, FormSearchAccountsPayables } from '../interfaces/accounts-payable.interface';
import { AccountsPayableService } from '../services/accounts-payable.service';
import * as moment from 'moment';
import { Subscription, } from 'rxjs';
import Swal from 'sweetalert2';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-accounts-payable',
  templateUrl: './accounts-payable.component.html',
  styles: [
    ` .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
    }
  `
  ]
})
export class AccountsPayableComponent implements OnInit {
  fb                     = inject(FormBuilder);
  validatorsService      = inject(ValidatorsService);
  providersService       = inject(ProvidersService);
  accountsPayableService = inject(AccountsPayableService);
  activatedRoute         = inject( ActivatedRoute );

  types_registry  = signal([{name: 'FICHA', code: 'FICHA'},{name: 'BOLETA', code: 'BOLETA'}]);
  providers       = signal<{name:string, code:string}[]>([]);
  loading         = signal(false);
  rows            = signal(50);
  page            = signal(1);
  type            = signal('');
  query           = signal('');
  accountsPayable = signal<AccountsPayable|undefined>(undefined);
  isReloadSub$!: Subscription;
  pipeNumber      = new DecimalPipe('en-US');
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  types_filtrado = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  cols  = signal<ColsTable[]>([
    { field: 'input.cod', header: 'COMPRA' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: 'input.type_registry', header: 'TIPO DOC.' , style:'min-width:80px;max-width:80px;', tooltip: true,isTag: true, 
      tagValue: (val:boolean)=>  val,
      tagColor: (val:boolean)=> 'success',
      tagIcon: (val:boolean)=>  'fa-solid fa-file'
    },
    { field: 'date_credit', header: 'FECHA CREDITO' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
    { field: 'monto_abonado', header: 'MONTO ABONADO' , style:'min-width:130px;max-width:130px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },
    { field: 'monto_restante', header: 'MONTO RESTANTE' , style:'min-width:130px;max-width:130px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },
    { field: 'total', header: 'TOTAL' , style:'min-width:100px;max-width:100px;text-align: center;', tooltip: true, isTag: true, 
      tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  ''
    },
    { field: `provider.full_names`, header: 'PROVEEDOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
    { field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true, activeSortable: false }
  ]);
  searchFor   = signal<SearchFor[]>([
                {name: 'COMPRA', code: 'input.cod'},
                {name: 'TOTAL', code: 'total'},
                {name: 'PROVEEDOR', code: 'provider.full_names'},
              ]);
  
  searchItems = signal<MenuItem[]>([
    { 
      label: 'Pendientes', icon: 'fa-solid fa-clock-rotate-left', 
      iconStyle: { 'color': '#14A44D'},
      command: () => {
        this.paramsSearch().status_account = 'PENDIENTE';
        this.getAllAndSearchAccountsPayable(1,this.rows());
      } 
    },
    { 
      label: 'Finalizados', icon: 'fa-solid fa-circle-check',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        this.paramsSearch().status_account = 'PAGADO';
        this.getAllAndSearchAccountsPayable(1,this.rows());
      }
    },
  ]);
  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['YEAR'],
    dates: [new Date(), [Validators.required]],
    type_registry: [''],
    id_provider: [''],
    id_sucursal: [''],
  });
  paramsSearch = signal<FormSearchAccountsPayables>({
    status_account:'PENDIENTE',
    type_registry: '',
    id_sucursal: '',
    id_provider: '',
    filterBy:'YEAR',
    date1:  moment().format('YYYY'),
    date2:'',
  });
  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelReport(); }
    },
  ];
  id_account_payable: number = 0;
  fieldSort = signal('');
  order     = signal('');
  idProveedor = signal<number|undefined>(undefined);
  txtSearch = signal('');

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      const {p:id_proveedor,c:id_compra} = params;
      if(!id_proveedor && !id_compra){
        this.getAllAndSearchAccountsPayable(1, this.rows());
      }
      if(id_compra){
        this.txtSearch.set(id_compra);
        this.getAllAndSearchAccountsPayable(1, this.rows(),'input.cod',id_compra);
      }
      this.idProveedor.set(id_proveedor);
    })
    this.getAllProviders();
    this.isReloadSub$ = this.accountsPayableService.reloadAccountsPayable$
        .subscribe((id_account_payable:number)=>{
          this.id_account_payable = id_account_payable;
          this.getAllAndSearchAccountsPayable(1, this.rows());
        }); 
  }

  getAllProviders() {
    this.providersService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp)=> {
        this.providers.set([]);
        resp.providers.data.forEach(provider => {
          this.providers.update((providers) => {
            return [
              ...providers,
              {
                name: `${provider.full_names} - ${provider.number_document ?? ''}`,
                code: provider.id.toString(),
              },
            ];
          });
        });
        if(this.idProveedor()){
          this.formReport.patchValue({id_provider: this.idProveedor() });
          this.getAllAndSearchAccountsPayable(1,this.rows());
          this.idProveedor.set(undefined);
        }
      },
      error: (err)=> this.providers.set([])
    });
  }

  getAllAndSearchAccountsPayable(page: number, limit: number,type: string = '', query: string = '') {
    this.formReport.get('id_sucursal')?.setValue(this.validatorsService.id_sucursal());
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(!query) {this.loading.set(true);} //not loading in search
    this.accountsPayableService.getAllAndSearchAccountsPayable(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.accountsPayable.set(resp.accountsPayable);
        this.accountsPayable()!.data.forEach((accountPayable) => {
          accountPayable.options = accountPayable.status_account == 'PENDIENTE'  ? [
            { 
              label:'',icon:'fa-solid fa-comments-dollar', 
              tooltip: 'Abonar',
              class:'p-button-rounded  p-button-warning p-button-sm',
              eventClick: () => {
                this.accountsPayableService.detailsSubs$.next(accountPayable);
                this.accountsPayableService.showModalNewAbono = true;
              }
            },
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver abonos',
              class:'p-button-rounded p-button-success p-button-sm ms-1',
              eventClick: () => {
                this.accountsPayableService.detailsSubs$.next(accountPayable);
                this.accountsPayableService.showModalDetailsAccountPayable = true;
              }
            },
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Estado de cuenta',
              disabled: this.validatorsService.withPermission('CUENTAS POR PAGAR','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.accountsPayableService.printAccountPayablePdf(accountPayable.id);
              }
            },
          ] : [
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver abonos',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => {
                this.accountsPayableService.detailsSubs$.next(accountPayable);
                this.accountsPayableService.showModalDetailsAccountPayable = true;
              }
            },
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Estado de cuenta',
              disabled: this.validatorsService.withPermission('CUENTAS POR PAGAR','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.accountsPayableService.printAccountPayablePdf(accountPayable.id);
              }
            },
          ] ;
        });
      },
      complete: () => {
        this.loading.set(false);
        //solo si es un nuevo abono
        const find_account_payable = this.accountsPayable()?.data.find((accountsPayable) => accountsPayable.id === this.id_account_payable);
        if(find_account_payable){
          this.accountsPayableService.detailsSubs$.next(find_account_payable!);
          this.id_account_payable = 0;
        }
      },
      error: () => this.loading.set(false)
    });
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal,id_provider,type_registry, id_product, dates} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        type_registry: type_registry ? type_registry : '',
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_product: id_product ? id_product : '',
        id_provider: id_provider ? id_provider : '',
        status_account: params.status_account,
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
      }
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
          this.accountsPayableService.getReportAccountsPayablePdf(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
          this.accountsPayableService.getReportAccountsPayableExcel(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
      filterBy: 'YEAR',
      dates: new Date(),
      type_registry: '',
      id_provider: '',
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
    this.getAllAndSearchAccountsPayable(this.page(),this.rows(),this.type(),this.query());
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
    this.getAllAndSearchAccountsPayable(1,this.rows(),this.type(),this.query());
  }
}
