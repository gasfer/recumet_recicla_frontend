import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransfersService } from '../services/transfers.service';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { FormSearchTransfers, Transfer, Transfers, UpdateTransferToReceived } from '../interfaces/transfers.interface';
import { DecimalPipe } from '@angular/common';
import { Sucursal } from '../../managements/interfaces/sucursales.interface';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { MenuItem } from 'primeng/api';
import * as moment from 'moment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-query-receptions',
  templateUrl: './query-receptions.component.html',
  styles: []
})

export class QueryReceptionsComponent implements OnInit {
  fb                     = inject(FormBuilder);
  validatorsService      = inject(ValidatorsService);
  transfersService       = inject(TransfersService);
  sucursalService        = inject(SucursalesService);

  loading         = signal(false);
  rows            = signal(50);
  page            = signal(1);
  type            = signal('');
  query           = signal('');
  transfers       = signal<Transfers|undefined>(undefined);
  pipeNumber      = new DecimalPipe('en-US');
  decimalLength   = signal(this.validatorsService.decimalLength());
  decimal         = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  sucursales      = signal<Sucursal[]>([]);
  id_transfer     = signal(0);

  types_filtrado  = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  cols  = signal<ColsTable[]>([]);
  searchFor   = signal<SearchFor[]>([
                {name: 'CÓDIGO', code: 'cod'},
                {name: 'TOTAL', code: 'total'},
                {name: 'OBS. ENVIÓ', code: 'observations_send'},
                {name: 'OBS. RECEPCIÓN', code: 'observations_received'},
              ]);
  
  searchItems = signal<MenuItem[]>([
    { 
      label: 'Recepciones Pendientes', icon: 'fa-solid fa-clock-rotate-left', 
      iconStyle: { 'color': '#14A44D'},
      command: () => {
        this.paramsSearch().status = 'PENDING';
        this.getAllAndSearchTransfers(1,this.rows());
      } 
    },
    { 
      label: 'Recepciones Aprobadas', icon: 'fa-solid fa-circle-check',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        this.paramsSearch().status = 'RECEIVED';
        this.getAllAndSearchTransfers(1,this.rows());
      }
    },
  ]);
  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['MONTH'],
    dates: [new Date(), [Validators.required]],
    id_sucursal_send: [],
    id_sucursal_received: [],
  });
  paramsSearch = signal<FormSearchTransfers>({
    status:'PENDING',
    filterBy:'MONTH',
    date1: moment().format('MM'),
    date2: moment().format('YYYY'),
  });
  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelReport(); }
    },
  ];
  fieldSort = signal('');
  order     = signal('');


  ngOnInit(): void {
    this.getAllAndSearchTransfers(1,this.rows());
    this.getAllSucursales();
  }

  getAllAndSearchTransfers(page: number, limit: number,type: string = '', query: string = '') {
    this.formReport.get('id_sucursal_received')?.setValue(this.validatorsService.id_sucursal());
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(this.paramsSearch().status === 'PENDING') {
      this.setColsStatusPending();
    } else {
      this.setColsStatusReceived();
    }
     if(!query) {this.loading.set(true);} //not loading in search
    this.transfersService.getAllAndSearchTransfers(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.transfers.set(resp.transfers);
        this.transfers()!.data.forEach((transfer) => {
          transfer.options = transfer.status == 'PENDING'  ? [
            { 
              label:'',icon:'fa-solid fa-thumbs-up', 
              tooltip: 'Aprobar',
              disabled: this.validatorsService.withPermission('RECEPCIONES','create'),
              class:'p-button-rounded p-button-secondary p-button-sm ms-1',
              eventClick: () => {
                this.id_transfer.set(transfer.id);
                this.transfersService.showModalConfirmationReception = true;
              }
            },
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver detalle',
              class:'p-button-rounded p-button-success p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.detailsSubs$.next(transfer);
                this.transfersService.showModalDetailsTransfer = true;
              }
            },
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Imprimir boleta',
              disabled: this.validatorsService.withPermission('RECEPCIONES','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.printPdfReport(transfer.id);
              }
            }
          ] : [
            { 
              label:'',icon:'fas fa-eye', 
              tooltip: 'Ver detalle',
              class:'p-button-rounded p-button-success p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.detailsSubs$.next(transfer);
                this.transfersService.showModalDetailsTransfer = true;
              }
            },
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Imprimir boleta',
              disabled: this.validatorsService.withPermission('RECEPCIONES','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.printPdfReport(transfer.id);
              }
            }
          ] ;
        });
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal_send,id_sucursal_received, dates} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        id_sucursal_received: id_sucursal_received,
        id_sucursal_send: id_sucursal_send ? id_sucursal_send : '' ,
        filterBy: filterBy,
        status: params.status,
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
          this.transfersService.getReportPdf(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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
          this.transfersService.getReportExcel(this.paramsSearch(),this.fieldSort(),this.order()).subscribe({
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

  getAllSucursales() {
    this.sucursalService.getAllAndSearch(1,100,true).subscribe({
      next: (resp) => {
        this.sucursales.set(resp.sucursales.data);
      },
    });
  }


  clearTransfers() {
    this.formReport.patchValue({
      filterBy: 'MONTH',
      dates: new Date(),
      id_sucursal_send: '',
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
    this.getAllAndSearchTransfers(this.page(),this.rows(),this.type(),this.query());
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
    this.getAllAndSearchTransfers(1,this.rows(),this.type(),this.query());
  }
  setColsStatusPending() {
    this.cols.set([{ field: 'cod', header: 'CÓDIGO' , style:'min-width:100px;max-width:100px;', tooltip: true},
      { field: 'date_send', header: 'FECHA ENVIÓ' , style:'min-width:110px;max-width:150px;', tooltip: true, isDate: true},
      { field: 'user_send.full_names', header: 'USUARIO ENVIÓ' , style:'min-width:110px;max-width:110px;', tooltip: true, isText:true},
      { field: 'total', header: 'MONTO' , style:'min-width:100px;max-width:100px;text-align: center;', tooltip: true, isTag: true, 
        tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
        tagColor: (val:number)=> 'primary',
        tagIcon: (val:number)=>  ''
      },
      { field: `sucursal_send.name`, header: 'SUCURSAL ORIGEN' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
      { field: 'observations_send', header: 'OBSERVACIÓN ENVIÓ' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
      { field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true, activeSortable: false }
    ]);
  }
  setColsStatusReceived() {
    this.cols.set([{ field: 'cod', header: 'CÓDIGO' , style:'min-width:100px;max-width:100px;', tooltip: true},
      { field: 'date_send', header: 'FECHA ENVIÓ' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
      { field: 'date_received', header: 'FECHA RECEPCIÓN' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
      { field: 'total', header: 'MONTO' , style:'min-width:100px;max-width:100px;text-align: center;', tooltip: true, isTag: true, 
        tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
        tagColor: (val:number)=> 'primary',
        tagIcon: (val:number)=>  ''
      },
      { field: `sucursal_send.name`, header: 'SUCURSAL ORIGEN' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
      { field: 'observations_send', header: 'OBS. ENVIÓ' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
      { field: 'observations_received', header: 'OBS. RECEPCIÓN' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
      { field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true, activeSortable: false }
    ]);
  }
}
