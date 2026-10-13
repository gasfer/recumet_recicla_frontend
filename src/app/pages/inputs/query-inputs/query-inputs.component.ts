import { downloadBlobFile } from 'src/app/core/helpers/download-blob-file';
import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { Provider } from '../interfaces/provider.interface';
import { firstValueFrom } from 'rxjs';
import { PurchaseEditEligibility, resolvePurchaseEditEligibility } from 'src/app/core/utils/purchase-edit-access';
import { PdfDocumentActionsService } from 'src/app/core/services/pdf-document-actions.service';
@Component({
  selector: 'app-query-inputs',
  templateUrl: './query-inputs.component.html',
  styles: [`
    :host { display:block; min-width:0; }
    .purchase-management-card { margin-bottom:.75rem; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 1px 3px rgba(15,23,42,.06); }
    .purchase-management-title { margin:0; color:#0b1324; font-size:1rem; font-weight:700; letter-spacing:.01em; }
    .purchase-management-card ::ng-deep .p-accordion .p-accordion-header .p-accordion-header-link { padding:.55rem .75rem; background:#f8fafc; border-color:#e2e8f0; color:#334155; font-size:.8rem; font-weight:700; }
    .purchase-management-card ::ng-deep .p-accordion .p-accordion-content { padding:.75rem; border-color:#e2e8f0; }
    .purchase-management-card ::ng-deep .purchase-filter-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); align-items:start; gap:.65rem .75rem; margin:0; }
    .purchase-management-card ::ng-deep .purchase-filter-field { display:flex; flex-direction:column; min-width:0; margin:0; }
    .purchase-management-card ::ng-deep .purchase-filter-field > .row { display:contents; }
    .purchase-management-card ::ng-deep .purchase-filter-field > .row > [class*="col-"] { width:auto; max-width:none; flex:none; padding:0; }
    .purchase-management-card ::ng-deep .purchase-filter-field > label { display:block; margin:0 0 .25rem; color:#475569; font-size:.72rem; font-weight:650; }
    .purchase-management-card ::ng-deep .purchase-filter-field .p-dropdown,
    .purchase-management-card ::ng-deep .purchase-filter-field .p-multiselect,
    .purchase-management-card ::ng-deep .purchase-filter-field .p-calendar,
    .purchase-management-card ::ng-deep .purchase-filter-field .erp-input { width:100%; min-width:0; }
    .purchase-management-card ::ng-deep .purchase-filter-field app-input-search { display:block; width:100%; min-width:0; }
    .purchase-management-card ::ng-deep .purchase-filter-field .p-dropdown,
    .purchase-management-card ::ng-deep .purchase-filter-field .p-multiselect,
    .purchase-management-card ::ng-deep .purchase-filter-field .p-inputtext { min-height:36px; font-size:.78rem; }
    .purchase-management-card ::ng-deep .purchase-filter-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:.5rem; padding-top:.65rem; border-top:1px solid #e2e8f0; }
    .purchase-management-card ::ng-deep .purchase-filter-field > label { overflow-wrap:anywhere; }
    .purchase-management-card ::ng-deep .purchase-filter-field .p-dropdown,
    .purchase-management-card ::ng-deep .purchase-filter-field .p-calendar { display:flex; }
    .purchase-management-card ::ng-deep .purchase-filter-storage { align-items:flex-start; gap:.25rem; }
    .purchase-management-card ::ng-deep .purchase-filter-storage small { font-size:.68rem; line-height:1.25; }
    .purchase-management-card ::ng-deep .purchase-provider-selection { display:flex; align-items:flex-start; gap:.35rem; min-width:0; }
    .purchase-management-card ::ng-deep .purchase-clear-provider { width:28px; height:28px; flex:0 0 28px; border:1px solid #fecdd3; border-radius:50%; background:#fff1f2; color:#be123c; }
    .purchase-management-card ::ng-deep .purchase-filter-selected-provider p-tag { display:flex; width:fit-content; max-width:100%; white-space:normal; }
    .purchase-management-card ::ng-deep .purchase-filter-selected-provider .p-tag-value { white-space:normal; overflow-wrap:anywhere; }
    .purchase-management-card ::ng-deep .purchase-filter-provider { position:relative; }
    .purchase-management-card ::ng-deep .purchase-filter-provider > div.position-absolute { top:100%; left:0; right:0; width:100%; z-index:20; }
    .purchase-management-card ::ng-deep .purchase-filter-provider ul { max-height:220px; overflow:auto; margin:0; }
    .purchase-management-card ::ng-deep .purchase-filter-actions { grid-column:1/-1; }
    @media(max-width:1050px) { .purchase-management-card ::ng-deep .purchase-filter-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
    @media(max-width:760px) { .purchase-management-card ::ng-deep .purchase-filter-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(max-width:520px) { .purchase-management-card ::ng-deep .purchase-filter-grid { grid-template-columns:minmax(0,1fr); } .purchase-management-card ::ng-deep .purchase-filter-actions > * { flex:1 1 100%; } }
  `]
})
export class QueryInputsComponent implements OnInit {
  fb                = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  inputsService     = inject(InputsService);
  pdfActions        = inject(PdfDocumentActionsService);
  providersService  = inject(ProvidersService);
  router            = inject(Router);
  pipeNumber = new DecimalPipe('en-US');
  minDate!: Date;
  maxDate!: Date;
  buttonItems: MenuItem[] = [
    {
      label: 'Reporte Compras',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelReport(); }
    },
    {
      label: 'Reporte Compras Detallado',
      icon: 'fas fa-file-pdf',
      iconStyle: { 'color': '#DC4C64'},
      command: () => { this.printPdfDetailsCPPReport(); }
    }, {
      label: 'Resumen por producto',
      icon: 'fas fa-file-pdf',
      iconStyle: { 'color': '#DC4C64'},
      command: () => { this.printPdfDetailsReport(); }
    },
    {
      label: 'Resumen producto',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': '#14A44D'},
      command: () => { this.printExcelDetailsReport(); }
    },
  ];
  searchItems = signal<MenuItem[]>([
    {
      label: 'Todos', icon: 'fas fa-list',
      iconStyle: { 'color': '#FF851B'},
      command: () => {
        this.cols()[0].isLink = false;
        this.paramsSearch().type_pay = '';
        this.paramsSearch().status = 'ACTIVE';
        this.getAllAndSearchInputs(1,this.rows());
      }
    },
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
    status: ['ACTIVE'],
    referral_sources: [''],
    id_type_provider: [''],
    old_customer: [''],
    with_pickup: [''],
  });
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'CÓDIGO' , style:'min-width:100px;max-width:100px;', tooltip: true, footer:'TOTALES'},
    {
      field: 'type_registry',
      field2: 'registry_number',
      header: 'TIPO DOC.',
      style:'min-width:160px;max-width:180px;',
      tooltip: true,
      isDocument: true,
    },
    { field: 'date_voucher', header: 'FECHA CMP.' , style:'min-width:110px;max-width:110px;', tooltip: true, isDate: true},
    { field: `provider.full_names`, header: 'PROVEEDOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
    { field: `comments`, header: 'OBSERVACIONES' , style:'min-width:100px;max-width:250px;', tooltip: true, isText: true  },
    { field: `total_quantity`, header: 'TOTAL KG' , style:'min-width:100px;max-width:100px;', tooltip: true, isTag: true,
      tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
      tagColor: (val:number)=> 'warning',
      tagIcon: (val:number)=>  'fas fa-boxes-stacked'
    },
    { field: `total`, header: 'TOTAL' , style:'min-width:100px;max-width:100px;', tooltip: true, isTag: true,
      tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
    { field: 'type', header: 'TIPO' , style:'min-width:80px;max-width:80px;', tooltip: true, isTag: true,
      tagValue: (val:string)=>  val,
      tagColor: (val:string)=> val == 'CONTADO' ? 'primary' : 'success',
      tagIcon: (val:string)=>  'fa-solid fa-sack-dollar'
    },
    { field: `old_customer`, header: 'ANTIGUO' , style:'min-width:80px;max-width:80px;', tooltip: true, isValueUpdate:true,
      tagValue: (val:boolean)=> val ? 'SI' : 'NO',
    },
    { field: `referral_sources`, header: 'NOS CONOCIÓ' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true  },
    { field: `with_pickup`, header: 'RECOJO' , style:'min-width:80px;max-width:80px;', tooltip: true, isValueUpdate:true,
      tagValue: (val:boolean)=> val ? 'SI' : 'NO',
    },
    { field: 'options', header: 'OPCIONES', style:'min-width:170px;max-width:170px', isButton:true }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'NUMBER DOC.', code: 'registry_number'},
    {name: 'CÓDIGO', code: 'cod'},
    {name: 'COMENTARIOS', code: 'comments'},
    {name: 'BALANZA', code: 'scale.name'},
    {name: 'USUARIO', code: 'user.full_names'},
  ]);
  loading      = signal(false);
  private hasObservedWorkContext = false;
  traceabilityVisible = signal(false);
  traceabilityData = signal<any>(null);
  rows         = signal(50);
  page         = signal(1);
  type         = signal('');
  query        = signal('');
  fieldSort    = signal('date_voucher');
  order        = signal('DESC');
  inputs       = signal<Inputs|undefined>(undefined);
  providers    = signal<{name:string, code:string}[]>([]);
  paramsSearch = signal<FormSearchInputs>({
    type_registry: '',
    id_provider:'',
    type_pay: '',
    id_storage: '',
    id_sucursal: '',
    status: 'ACTIVE',
    filterBy:'MONTH',
    date1: '',
    date2: '',
    referral_sources: '',
    id_type_provider: '',
    old_customer: '',
    with_pickup: '',
  });
  types_filtrado = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  yes_no_type = signal([
    {name: 'SI', code: 'SI'},
    {name: 'NO', code: 'NO'},
  ]);

  referral_sources = computed(this.inputsService.referral_sources);
  activeStorageName = computed(() => (
    this.validatorsService.storages().find(storage => storage.id === this.validatorsService.id_storage())?.name || 'Sin almacén activo'
  ));
  types = signal<{name:string, code:string}[]>([]);
  txtSearchProvider      = signal('');
  suggestedProvider      = signal<Provider[]>([]);
  loadingSearchProvider  = signal(false);
  providerSelect         = signal<Provider|undefined>(undefined);

  constructor() {
    effect(() => {
      const idSucursal = this.validatorsService.id_sucursal();
      const idStorage = this.validatorsService.id_storage();
      if (!idSucursal || !idStorage) return;
      if (!this.hasObservedWorkContext) {
        this.hasObservedWorkContext = true;
        return;
      }
      untracked(() => this.getAllAndSearchInputs(1, this.rows(), this.type(), this.query()));
    });
  }

  ngOnInit(): void {
    this.getAllAndSearchInputs(1,this.rows());
    this.getAllTypes();
  }

  suggestedsProvider(txtSearchProvider: string){
    if(txtSearchProvider.length==0) {
      this.txtSearchProvider.set('');
      this.suggestedProvider.set([]);
      return;
    }
    this.loadingSearchProvider.set(true);
    this.txtSearchProvider.set(txtSearchProvider);
    this.suggestedProvider.set([]);
    this.providersService.getAllAndSearch(1,100000,true,'pos',txtSearchProvider,'full_names','ASC')
        .subscribe({
          next: (resp) => {
            this.suggestedProvider.set(resp.providers.data);
            this.loadingSearchProvider.set(false);
          },
          error: (e) => {
            this.loadingSearchProvider.set(false);
          }
        });
  }

  selectProvider(provider: Provider) {
    this.suggestedProvider.set([]);
    this.txtSearchProvider.set('');
    this.providerSelect.set(provider);
    this.formReport.get('id_provider')?.setValue(this.providerSelect()?.id);
  }

  clearSelectProvider() {
    this.providerSelect.set(undefined);
    this.formReport.get('id_provider')?.setValue(null);
  }

  purchaseEditEligibility(input: Input): PurchaseEditEligibility {
    const isAdmin = this.validatorsService.user()?.role === 'ADMINISTRADOR';
    return resolvePurchaseEditEligibility(
      this.validatorsService.withPermission('COMPRAS', 'update'),
      this.validatorsService.hasDaysPassedSinceEdit(input.date_voucher, 30),
      isAdmin,
    );
  }

  requestPurchaseEdit(input: Input): void {
    const eligibility = this.purchaseEditEligibility(input);
    if (!eligibility.allowed) {
      void Swal.fire({
        title: eligibility.title,
        text: eligibility.message,
        icon: 'warning',
        customClass: { container: 'swal-alert' },
      });
      return;
    }

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
    void this.router.navigateByUrl('/inputs/input-small');
  }

  getAllAndSearchInputs(page: number, limit: number,type: string = '', query: string = '') {
    const idSucursal = this.validatorsService.id_sucursal();
    const idStorage = this.validatorsService.id_storage();
    this.formReport.patchValue({ id_sucursal: idSucursal, id_storage: idStorage }, { emitEvent: false });
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid || !idSucursal || !idStorage) return;
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
              label:'',icon:'fa-solid fa-clock-rotate-left',
              tooltip: 'Ver trazabilidad',
              class:'p-button-rounded p-button-info p-button-sm ms-1',
              eventClick: () => this.showTraceability(input)
            },
            {
              label:'',icon:'fas fa-edit',
              tooltip: this.purchaseEditEligibility(input).tooltip,
              ariaLabel: this.purchaseEditEligibility(input).ariaLabel,
              ariaDisabled: !this.purchaseEditEligibility(input).allowed,
              class: this.purchaseEditEligibility(input).allowed
                ? 'p-button-rounded p-button-warning p-button-sm ms-1'
                : 'p-button-rounded p-button-secondary p-button-outlined p-button-sm ms-1',
              eventClick: () => this.requestPurchaseEdit(input),
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
            {
              label:'',icon:'fa-solid fa-clock-rotate-left',
              tooltip: 'Ver trazabilidad',
              class:'p-button-rounded p-button-info p-button-sm ms-1',
              eventClick: () => this.showTraceability(input)
            },
          ] ;
        });
        const totalInput = resp.inputs?.totals?.totalInput ?? 0;
        const totalQuantity = resp.inputs?.totals?.totalQuantity ?? 0;
        this.cols()[6].footer =  this.pipeNumber.transform(totalQuantity,this.decimal()) ?? '0';
        this.cols()[7].footer =  this.pipeNumber.transform(totalInput,this.decimal()) ?? '0';
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });

  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
  }

  async showTraceability(input: Input) {
    Swal.fire({ title: 'Cargando trazabilidad', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
    try {
      const response = await firstValueFrom(this.inputsService.getPurchaseTraceability(input.id));
      Swal.close();
      this.traceabilityData.set(response.traceability);
      this.traceabilityVisible.set(true);
    } catch {
      await Swal.fire('Atención', 'No se pudo consultar la trazabilidad de la compra.', 'error');
    }
  }

  async anularInput(input: Input) {
    try {
      const response = await firstValueFrom(this.inputsService.previewVoidInput(input.id));
      const preview = response.preview;
      const materials = (preview.materials || []).map((item: any) => `<li>${this.escapeHtml(item.product?.cod)} · ${this.escapeHtml(item.product?.name)}: ${this.escapeHtml(item.quantity)} kg</li>`).join('');
      const account = preview.account_payable ? `<p><b>Cuenta por pagar:</b> ${this.escapeHtml(preview.account_payable.cod)} · Pendiente Bs ${this.escapeHtml(preview.account_payable.pending)}</p>` : '<p>Sin cuenta por pagar.</p>';
      const result = await Swal.fire({
      title: `Anular compra ${this.escapeHtml(input.cod)}`,
      html: `<div style="text-align:left"><p>Esta acción conservará la auditoría y descontará el stock correspondiente.</p><p><b>Proveedor:</b> ${this.escapeHtml(preview.purchase.provider?.full_names)}</p>${account}<b>Materiales:</b><ul>${materials}</ul></div>`,
      icon: `warning`,
      input: 'textarea',
      inputLabel: 'Motivo obligatorio',
      inputPlaceholder: 'Explique por qué se anula esta compra',
      inputValidator: value => String(value || '').trim().length < 5 ? 'Ingrese un motivo de al menos 5 caracteres.' : undefined,
      confirmButtonText: `Sí, anular compra`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: async (reason) => {
        try { await firstValueFrom(this.inputsService.deleteInput(input.id, String(reason).trim())); return true; }
        catch (error: any) { Swal.showValidationMessage(error?.error?.errors?.[0]?.msg || 'No se pudo anular la compra.'); return false; }
      },
      allowOutsideClick: () => !Swal.isLoading()
      });
      if(result.isConfirmed && result.value) {
        this.getAllAndSearchInputs(1,this.rows());
        await Swal.fire({
          title: 'Éxito!',
          text: `La compra fue anulada correctamente, Disponible en la sección de anulados`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    } catch {
      await Swal.fire('Atención', 'No se pudo preparar la anulación de la compra.', 'error');
    }
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, type_registry, id_provider, dates, referral_sources, id_type_provider, old_customer, with_pickup} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY';
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        type_registry: type_registry ? type_registry : '',
        id_sucursal: String(this.validatorsService.id_sucursal() || ''),
        id_storage: String(this.validatorsService.id_storage() || ''),
        id_provider: id_provider ? id_provider : '',
        type_pay: params.type_pay,
        status: params.status,
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
        referral_sources: referral_sources ? referral_sources : '',
        id_type_provider: id_type_provider ? id_type_provider : '',
        old_customer: old_customer ? old_customer : '',
        with_pickup: with_pickup ? with_pickup : '',
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
      referral_sources: '',
      id_type_provider: '',
      old_customer: '',
      with_pickup: '',  
    });
  }

  printPdfReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();

    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.pdfActions.prepareRequest(this.inputsService.getReportPdf(this.paramsSearch(),this.fieldSort(),this.order())).subscribe({
      next: (data) => {
        Swal.close();
        this.pdfActions.show(data, 'reporte_compras.pdf', 'Reporte de compras');
      },
      error: () => {
        Swal.fire('No se pudo generar el PDF', 'Revise los filtros e intente nuevamente.', 'error');
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
              downloadBlobFile(data, 'reporte_compras_detallado.xlsx');
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
          this.pdfActions.prepareRequest(this.inputsService.getReportDetailsPdf(this.paramsSearch())).subscribe({
            next: (data) => { Swal.close(); this.pdfActions.show(data, 'reporte_compras_resumen_por_producto.pdf', 'Resumen de compras por producto'); },
            error: (err) => {
              Swal.close();
            },
          });
        });
      },
    });
  }

   printPdfDetailsCPPReport() {
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.pdfActions.prepareRequest(this.inputsService.getReportDetailsCPPPdf(this.paramsSearch())).subscribe({
            next: (data) => { Swal.close(); this.pdfActions.show(data, 'reporte_compras_costo_promedio.pdf', 'Detalle de costo promedio'); },
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
              downloadBlobFile(data, 'reporte_compras_costo_promedio.xlsx');
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

  getAllTypes() {
    this.types.set([]);
    this.providersService.getAllTypesProvider().subscribe(resp => {
      const formattedType = resp.typesProvider.map(type => ({
        name: type.name,
        id: type.id!.toString(),
        code: type.code,
      })).sort((a, b) => a.name.localeCompare(b.name));
      formattedType.unshift(
        {code:'ALL', name:'TODOS',id: ''}
      )
      this.types.set(formattedType);
      if(formattedType.length > 0) {
        this.formReport.get('id_type_provider')?.setValue('');
        this.getAllAndSearchInputs(1,this.rows());
      }
    });
  }
}
