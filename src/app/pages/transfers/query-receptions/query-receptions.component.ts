import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransfersService } from '../services/transfers.service';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { FormSearchTransfers, InfoStackItem, Transfer, Transfers, UpdateTransferToReceived } from '../interfaces/transfers.interface';
import { DecimalPipe } from '@angular/common';
import { Sucursal } from '../../managements/interfaces/sucursales.interface';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { MenuItem } from 'primeng/api';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { TransferReviewService } from 'src/app/services/transfer-review.service';
import { ActivatedRoute } from '@angular/router';
import { getSucursalBadgeStyle } from 'src/app/core/utils/sucursal-badge.util';
import { canCancelReception, isTransferCancellationAdministrator, receptionCancellationMessage } from '../utils/transfer-cancellation-actions.util';

@Component({
  selector: 'app-query-receptions',
  templateUrl: './query-receptions.component.html',
  styleUrls: ['./query-receptions.component.scss']
})

export class QueryReceptionsComponent implements OnInit {
  fb                     = inject(FormBuilder);
  validatorsService      = inject(ValidatorsService);
  transfersService       = inject(TransfersService);
  sucursalService        = inject(SucursalesService);
  reviewService          = inject(TransferReviewService);
  route                  = inject(ActivatedRoute);

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
        this.activeSearchItem.set(this.searchItems()[0]);
        this.paramsSearch.update(params => ({ ...params, status: 'PENDING', inconclusive: undefined }));
        this.getAllAndSearchTransfers(1,this.rows());
      }
    },
    {
      label: 'Recepciones Aprobadas', icon: 'fa-solid fa-circle-check',
      iconStyle: { 'color': '#3B71CA'},
      command: () => {
        this.activeSearchItem.set(this.searchItems()[1]);
        this.paramsSearch.update(params => ({ ...params, status: 'RECEIVED', inconclusive: undefined }));
        this.getAllAndSearchTransfers(1,this.rows());
      }
    },
    {
      label: 'Recepciones Inconclusas', icon: 'fa-solid fa-triangle-exclamation',
      iconStyle: { 'color': '#dc2626'},
      command: () => {
        this.activeSearchItem.set(this.searchItems()[2]);
        this.paramsSearch.update(params => ({ ...params, status: 'RECEIVED', inconclusive: true }));
        this.getAllAndSearchTransfers(1,this.rows());
      }
    },
  ]);
  activeSearchItem = signal<MenuItem | undefined>(undefined);
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
    const openInconclusive = this.route.snapshot.queryParamMap.get('view') === 'inconclusive';
    if (openInconclusive) {
      this.paramsSearch.update(params => ({ ...params, status: 'RECEIVED', inconclusive: true }));
      this.activeSearchItem.set(this.searchItems()[2]);
    } else {
      this.activeSearchItem.set(this.searchItems()[0]);
    }
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
          transfer.reception_dates = this.receptionDates(transfer);
          transfer.origin_destination = [
            { icon: 'fa-solid fa-building', label: 'Origen', value: transfer.sucursal_send.name, tone: 'primary', badgeStyle: getSucursalBadgeStyle(transfer.sucursal_send.name) },
            { icon: 'fa-solid fa-arrow-right-long', label: 'Destino', value: transfer.sucursal_received.name, tone: 'success', badgeStyle: getSucursalBadgeStyle(transfer.sucursal_received.name) },
          ];
          transfer.reception_observations = this.receptionObservations(transfer);
          transfer.transferred_weight = this.transferredWeight(transfer);
          transfer.review_note_cards = this.reviewNoteCards(transfer);
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
              tooltip: 'Imprimir guía de traslado (vertical)',
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
            ...(this.paramsSearch().inconclusive
              && (Number(transfer.pending_review_items || 0) > 0 || transfer.review_closure_pending) ? [{
              label:'',
              icon:'fa-solid fa-clipboard-list',
              tooltip: 'Revisar notas inconclusas',
              ariaLabel: `Revisar notas inconclusas del traslado ${transfer.cod}`,
              class:'p-button-rounded p-button-warning p-button-sm ms-1',
              eventClick: () => this.reviewService.openTrace(transfer.id)
            }] : []),
            {
              label:'',icon:'fas fa-print',
              tooltip: 'Imprimir guía de traslado (vertical)',
              disabled: this.validatorsService.withPermission('RECEPCIONES','reports'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.printPdfReport(transfer.id);
              }
            },
            {
              label:'',icon:'fas fa-clipboard-check',
              tooltip: 'Imprimir guía de recepción (horizontal)',
              disabled: this.validatorsService.withPermission('RECEPCIONES','reports'),
              class:'p-button-rounded p-button-info p-button-sm ms-1',
              eventClick: () => {
                this.transfersService.printReceptionPdfReport(transfer.id);
              }
            },
            ...(isTransferCancellationAdministrator(this.validatorsService.user()?.role)
              ? [canCancelReception(transfer) ? {
                  label: '',
                  icon: 'fa-solid fa-rotate-left',
                  tooltip: 'Anular recepción',
                  ariaLabel: `Anular recepción del traslado ${transfer.cod}`,
                  class: 'p-button-rounded p-button-danger p-button-sm ms-1',
                  eventClick: () => this.cancelReception(transfer),
                } : {
                  label: '',
                  icon: 'fa-solid fa-lock',
                  tooltip: receptionCancellationMessage(transfer),
                  ariaLabel: `Anulación bloqueada: ${receptionCancellationMessage(transfer)}`,
                  disabled: false,
                  class: 'p-button-rounded p-button-secondary p-button-sm ms-1',
                }]
              : [])
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
      const common = {
        id_sucursal_received: id_sucursal_received,
        id_sucursal_send: id_sucursal_send ? id_sucursal_send : '' ,
        status: params.status,
        ...(params.inconclusive ? { inconclusive: true } : {}),
      };
      if (params.inconclusive && filterBy !== 'RANGE') return common as FormSearchTransfers;
      return {
        ...common,
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
      }
    });
  }

  cancelReception(transfer: Transfer): void {
    Swal.fire({
      title: `Anular recepción ${transfer.cod}`,
      text: 'Se revertirán la recepción y sus conciliaciones completadas. El traslado volverá a pendiente.',
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo de anulación',
      inputPlaceholder: 'Describa el motivo (mínimo 10 caracteres)',
      inputValidator: (value) => {
        const reason = String(value || '').trim();
        return reason.length < 10 ? 'El motivo debe tener al menos 10 caracteres.' : null;
      },
      confirmButtonText: 'Sí, anular recepción',
      cancelButtonText: 'Cancelar',
      showCancelButton: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: (value) => new Promise((resolve) => {
        this.transfersService.cancelReception(transfer.id, String(value).trim()).subscribe({
          next: () => resolve(true),
          error: (error) => {
            const message = error?.error?.errors?.[0]?.msg || 'No se pudo anular la recepción.';
            Swal.showValidationMessage(message);
            resolve(false);
          },
        });
      }),
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;
      this.getAllAndSearchTransfers(1, this.rows());
      Swal.fire('Recepción anulada', 'El traslado volvió a estado pendiente y se conservaron los movimientos de trazabilidad.', 'success');
    });
  }

  get isInconclusiveMode(): boolean {
    return this.paramsSearch().inconclusive === true;
  }

  reviewNote(transferId: number, noteId: number): void {
    this.reviewService.openTrace(transferId, noteId);
  }

  refreshInconclusiveReviews(): void {
    this.activeSearchItem.set(this.searchItems()[2]);
    this.paramsSearch.update(params => ({ ...params, status: 'RECEIVED', inconclusive: true }));
    this.getAllAndSearchTransfers(1, this.rows());
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
      { field: `sucursal_send.name`, header: 'SUCURSAL ORIGEN' , style:'min-width:150px;max-width:200px;', tooltip: true, isSucursalBadge: true },
      { field: 'observations_send', header: 'OBSERVACIÓN ENVIÓ' , style:'min-width:100px;max-width:150px;', tooltip: true, isText: true},
      { field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true, activeSortable: false }
    ]);
  }
  setColsStatusReceived() {
    this.cols.set([{ field: 'cod', header: 'TRASLADO' , style:'min-width:100px;max-width:105px;', tooltip: true},
      { field: 'reception_dates', header: 'ENVÍO / RECEPCIÓN' , style:'min-width:155px;max-width:170px;', tooltip: true, isInfoStack: true, activeSortable: false},
      { field: 'transferred_weight', header: 'PESO TRASLADADO' , style:'min-width:120px;max-width:135px;', tooltip: true, isInfoStack: true, activeSortable: false},
      { field: 'origin_destination', header: 'ORIGEN → DESTINO' , style:'min-width:185px;max-width:220px;', tooltip: true, isInfoStack: true, activeSortable: false},
      { field: 'reception_observations', header: 'OBSERVACIONES' , style:'min-width:165px;max-width:195px;', tooltip: true, isInfoStack: true, activeSortable: false},
      { field: 'reconciliation_status', header: 'CONCILIACIÓN', style:'min-width:110px;max-width:130px;', isTag: true,
        tagValue: (status:string) => status === 'EN_REVISION' ? 'EN REVISIÓN' : status,
        tagColor: (status:string) => status === 'EN_REVISION' ? 'danger' : status === 'PARCIAL' ? 'warning' : 'success',
        tagIcon: () => ''
      },
      ...(this.isInconclusiveMode ? [{ field: 'review_note_cards', header: 'NTR Y DIFERENCIAS', style:'min-width:265px;max-width:330px;', isReviewNotes: true, activeSortable: false }] : [{ field: 'pending_review_items', header: 'PENDIENTES', style:'min-width:90px;max-width:100px;text-align:center;', tooltip: true}]),
      { field: 'options', header: 'OPCIONES', style:'min-width:180px;max-width:180px', isButton:true, activeSortable: false }
    ]);
  }

  private receptionDates(transfer: Transfer): InfoStackItem[] {
    return [
      { icon: 'fa-solid fa-truck-arrow-right', label: 'Envío', value: moment(transfer.date_send).format('DD/MM/YYYY, HH:mm'), tone: 'primary' },
      { icon: 'fa-solid fa-box-open', label: 'Recepción', value: transfer.date_received ? moment(transfer.date_received).format('DD/MM/YYYY, HH:mm') : 'Pendiente', tone: transfer.date_received ? 'success' : 'warning' },
    ];
  }

  private receptionObservations(transfer: Transfer): InfoStackItem[] {
    return [
      { icon: 'fa-solid fa-comment-dots', label: 'Envío', value: transfer.observations_send || 'Sin observación', tone: 'primary' },
      { icon: 'fa-solid fa-comment-check', label: 'Recepción', value: transfer.observations_received || 'Sin observación', tone: 'success' },
    ];
  }

  private transferredWeight(transfer: Transfer): InfoStackItem[] {
    const kilograms = Number(transfer.total_quantity || 0) || transfer.detailsTransfers.reduce((total, detail) => total + Number(detail.quantity || 0), 0);
    const formatted = this.pipeNumber.transform(kilograms, this.decimal()) || '0';
    return [{ icon: 'fa-solid fa-weight-hanging', label: 'Trasladado', value: kilograms >= 1000 ? `${formatted} kg · ${(kilograms / 1000).toFixed(2)} t` : `${formatted} kg`, tone: 'warning' }];
  }

  private reviewNoteCards(transfer: Transfer): NonNullable<Transfer['review_note_cards']> {
    return (transfer.open_review_notes || []).map((note) => {
      const type = note.type === 'EXCEDENTE_PARA_REVISION' ? 'Excedente' : 'Faltante';
      return {
        registry_number: note.registry_number,
        type: note.type,
        pending_items: note.pending_items,
        details: note.details
          .filter((detail) => detail.reconciliation_status !== 'COMPLETADO')
          .map((detail) => `${detail.product?.cod || 'Producto'} · ${type}: ${this.pipeNumber.transform(detail.quantity_remaining, this.decimal()) || detail.quantity_remaining}`),
        open: () => this.reviewNote(transfer.id, note.id),
      };
    });
  }
}
