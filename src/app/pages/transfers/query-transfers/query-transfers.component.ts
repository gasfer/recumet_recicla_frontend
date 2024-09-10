import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormSearchTransfers, Transfer, Transfers } from '../interfaces/transfers.interface';
import { DecimalPipe } from '@angular/common';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { MenuItem } from 'primeng/api';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { TransfersService } from '../services/transfers.service';
import { Sucursal } from '../../managements/interfaces/sucursales.interface';
import { SucursalesService } from '../../managements/services/sucursales.service';

@Component({
  selector: 'app-query-transfers',
  templateUrl: './query-transfers.component.html',
  styles: [ ` .card {
    margin-bottom: 10px;
    border: none;
    border-radius: 15px;
    box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
  }
  ` ]
})
export class QueryTransfersComponent implements OnInit {
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
      label: 'Traslados Pendientes', icon: 'fa-solid fa-clock-rotate-left', 
      iconStyle: { 'color': '#14A44D'},
      command: () => {
        this.paramsSearch().status = 'PENDING';
        this.getAllAndSearchTransfers(1,this.rows());
      } 
    },
    { 
      label: 'Traslados Aprobados', icon: 'fa-solid fa-circle-check',
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
    this.formReport.get('id_sucursal_send')?.setValue(this.validatorsService.id_sucursal());
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
              disabled: this.validatorsService.withPermission('TRASLADOS','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.printPdfReport(transfer.id);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Anular',
              disabled: this.validatorsService.withPermission('TRASLADOS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.destroyTransfer(transfer);
              }
            },
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
              disabled: this.validatorsService.withPermission('TRASLADOS','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.printPdfReport(transfer.id);
              }
            },
          ] ;
        });
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  destroyTransfer(transfer: Transfer) {
    Swal.fire({
      title: `¿Esta seguro de anular traslado?`,
      text: `Esta apunto de anular el traslado: ${transfer.cod}}`,
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
          this.transfersService.deleteTransfer(transfer.id).subscribe({
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
        this.getAllAndSearchTransfers(1,this.rows());
        Swal.fire({ 
          title: 'Éxito!', 
          text: `El traslado fue anulado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal_send,id_sucursal_received, dates} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        id_sucursal_send: id_sucursal_send,
        id_sucursal_received: id_sucursal_received ? id_sucursal_received : '' ,
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
      id_sucursal_received: '',
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
      { field: `sucursal_received.name`, header: 'SUCURSAL DESTINO' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
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
      { field: `sucursal_received.name`, header: 'SUCURSAL DESTINO' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
      { field: 'observations_send', header: 'OBS. ENVIÓ' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
      { field: 'observations_received', header: 'OBS. RECEPCIÓN' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
      { field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true, activeSortable: false }
    ]);
  }
}
