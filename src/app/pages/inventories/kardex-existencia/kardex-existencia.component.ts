import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { LazyLoadEvent, MenuItem } from 'primeng/api';
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
import { InputsService } from '../../inputs/services/inputs.service';
import { OutputService } from '../../outputs/services/output.service';
import { ClassifiedService } from '../../classifieds/services/classified.service';
import { TransfersService } from '../../transfers/services/transfers.service';
import { PdfDocumentActionsService } from 'src/app/core/services/pdf-document-actions.service';
import { Observable } from 'rxjs';
import { downloadBlobFile } from 'src/app/core/helpers/download-blob-file';

@Component({
  selector: 'app-kardex-existencia',
  templateUrl: './kardex-existencia.component.html',
  styles: [`
    .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: var(--shadow-md);
    }

    .kardex-detail-workspace {
      margin-bottom: var(--spacing-xl);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .kardex-detail-filter-card {
      margin: 0 !important;
      border: 0 !important;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    .kardex-detail-filter-card .card-body { padding: var(--spacing-lg); }

    :host ::ng-deep .kardex-detail-view-tabs {
      margin: 0;
      border-top: 1px solid var(--color-border-subtle);
      border-bottom: 1px solid var(--color-border);
      background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
    }

    :host ::ng-deep .kardex-detail-view-tabs .p-tabmenu-nav {
      border: 0;
      border-radius: 0;
      background: transparent;
    }

    .kardex-detail-table { display: block; padding: 0 var(--spacing-sm) var(--spacing-sm); }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-thead > tr > th {
      border-color: var(--color-primary) !important;
      background: var(--color-primary) !important;
      color: var(--color-primary-on) !important;
      font-weight: 700;
    }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tbody > tr > td {
      border-color: var(--color-border-subtle) !important;
      background: var(--color-surface) !important;
      color: var(--color-text);
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
    }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tbody > tr:nth-child(even) > td {
      background: color-mix(in srgb, var(--color-primary) 2.5%, var(--color-surface)) !important;
    }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tbody > tr:hover > td {
      border-color: color-mix(in srgb, var(--color-primary) 22%, var(--color-border)) !important;
      background: var(--color-surface-hover) !important;
    }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tbody .badge.text-primary {
      border: 1px solid var(--color-success-border) !important;
      border-radius: var(--radius-md) !important;
      background: var(--color-success-light) !important;
      color: var(--color-success-text) !important;
      font-weight: 700;
      transition: background-color var(--transition-fast), border-color var(--transition-fast);
    }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tbody .badge.text-primary:hover,
    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tbody .badge.text-primary:focus-visible {
      border-color: var(--color-primary) !important;
      background: color-mix(in srgb, var(--color-primary) 16%, var(--color-surface)) !important;
      color: var(--color-success-text) !important;
      outline: 2px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
      outline-offset: 2px;
    }

    :host ::ng-deep app-table.kardex-detail-table .p-datatable-tfoot > tr > td {
      border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border)) !important;
      background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)) !important;
      color: var(--color-text);
      font-weight: 700;
    }

    @media (max-width: 768px) {
      .kardex-detail-table { padding: 0 0 var(--spacing-sm); }
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
  inputsService         = inject( InputsService );
  outputService         = inject( OutputService );
  classifiedService     = inject( ClassifiedService );
  transfersService      = inject( TransfersService );
  pdfActions            = inject( PdfDocumentActionsService );

  providers             = signal<{name:string, code:string}[]>([]);
  loading               = signal(false);
  rows                  = signal(50);
  page                  = signal(1);
  type                  = signal('');
  query                 = signal('');
  kardexes              = signal<Kardexes|undefined>(undefined);
  suggestedProducts     = signal<Product[]>([]);
  productSelect         = signal<Product|undefined>(undefined);

  // 🆕 Signals para el dropdown de productos
  loadingSearchProduct  = signal(false);
  dropdownProducts      = signal<Product[]>([]);
  totalProducts         = signal(0);
  dropdownPage          = signal(1);
  dropdownLimit         = signal(50);
  dropdownFilter        = signal('');
  productSelectValue: Product | null = null;

  pipeNumber            = new DecimalPipe('en-US');
  decimalLength         = signal(this.validatorsService.decimalLength());
  decimal               = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  paramsSearch      = signal<FormSearchKardex>({
    filterBy:'YEAR',
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
      label: 'KARDEX DE EXISTENCIAS (PDF)',
      icon: 'fa-solid fa-file-pdf',
      iconStyle: { color: 'var(--color-danger)' },
      command: () => {
        if (!this.loading()) this.printPdfReport();
      }
    },
    {
      label: 'KARDEX DE EXISTENCIAS (Excel)',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { 'color': 'var(--color-primary)'},
      command: () => {
        if (!this.loading()) this.printExcelReport();
      }
    },
  ];

  searchItems = signal<MenuItem[]>([
    {
      label: 'ENTRADAS Y SALIDAS', icon: 'fa-solid fa-left-right',
      iconStyle: { 'color': 'var(--color-info)'},
      command: () => {
        this.paramsSearch().type_kardex = '';
        this.getAllAndSearchKardex(1,this.rows());
      }
    },
    {
      label: 'ENTRADAS', icon: 'fa-solid fa-arrow-left',
      iconStyle: { 'color': 'var(--color-primary)'},
      command: () => {
        this.paramsSearch().type_kardex = 'INPUT';
        this.getAllAndSearchKardex(1,this.rows());
      }
    },
    {
      label: 'SALIDAS', icon: 'fa-solid fa-arrow-right',
      iconStyle: { 'color': 'var(--color-danger)'},
      command: () => {
        this.paramsSearch().type_kardex = 'OUTPUT';
        this.getAllAndSearchKardex(1,this.rows());
      }
    },
  ]);

  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['YEAR'],
    dates: [new Date(), [Validators.required]],
    type_kardex: [''],
    id_sucursal: ['',[Validators.required]],
    id_storage: [''],
    id_provider: [''],
    id_product: ['']
  });

  cols = signal<ColsTable[]>([
    { field: 'date', header: 'FECHA' , style:'min-width:100px;max-width:100px;', tooltip: true, isDate: true},
    { field: `registry_number`, header: 'N°' , style:'min-width:80px;max-width:100px;', tooltip: true,  isTag: true,
      tagValue: (val:string)=>  val ? val : '-',
      tagColor: (val:number)=> 'success',
      tagIcon: (val:number)=>  'fa-solid fa-file'
    },
    { field: `detail`,field2: 'sub_detail', header: 'DETALLE' , style:'min-width:180px;max-width:200px;', tooltip: true, isDoubleValue:true  },
    { field: `quantity_input`, header: 'ENTRADA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
      },
    { field: `quantity_output`, header: 'SALIDA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true ,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
     },
    { field: `saldo`, header: 'SALDO' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true ,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
     },

    { field: `cost_unitario`, header: 'P.U.' , style:'min-width:90px;max-width:100px;text-align: center;', tooltip: true, isTag: true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },

    { field: `cost_input`, header: 'ENTRADA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },

    { field: `cost_output`, header: 'SALIDA' , style:'min-width:90px;max-width:120px;text-align: center;', tooltip: true ,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
     },
    { field: `cost_saldo`, header: 'SALDO' , style:'min-width:90px;max-width:100px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),

      },
    { field: 'options', header: 'VER', style:'min-width:80px;max-width:80px', isButton:true }
  ]);

  fieldSort = signal('date');
  order     = signal('DESC');

  ngOnInit(): void {
    // 🆕 Cargar productos al iniciar
    this.loadDropdownProducts();

    this.activatedRoute.queryParams.subscribe(params => {
      const { p: id_product } = params;
      if (id_product) {
        this.findProduct(id_product);
      }
    });

    this.formReport.patchValue({
      filterBy: 'RANGE',
      dates: [new Date('2020-01-01'), new Date()],
      id_sucursal: this.validatorsService.id_sucursal()
    });

    this.formReport.patchValue({ id_storage: this.validatorsService.id_storage() || '' });

    this.getAllProviders();
  }

  // 🆕 ===== MÉTODOS PARA DROPDOWN DE PRODUCTOS =====

  loadDropdownProducts(reset: boolean = false): void {
    if (reset) {
      this.dropdownPage.set(1);
      this.dropdownProducts.set([]);
    }

    this.loadingSearchProduct.set(true);

    this.productService.getAllAndSearch(
      this.dropdownPage(),
      this.dropdownLimit(),
      true,
      'pos',
      this.dropdownFilter()
    ).subscribe({
      next: (resp) => {
        if (reset) {
          this.dropdownProducts.set(resp.products.data);
        } else {
          this.dropdownProducts.update(products => [...products, ...resp.products.data]);
        }
        this.totalProducts.set(resp.products.total);
        this.loadingSearchProduct.set(false);
      },
      error: (e) => {
        this.loadingSearchProduct.set(false);
      }
    });
  }

  // 🆕 Evento cuando se selecciona un producto desde el dropdown
  onProductSelect(product: Product | null): void {
    console.log('onProductSelect llamado con:', product);

    if (product) {
      this.productSelect.set(product);
      this.productSelectValue = product;
      this.formReport.patchValue({
        id_product: product.id
      });

      console.log('✓ Producto seleccionado:', {
        id: product.id,
        cod: product.cod,
        name: product.name
      });

      // 🔥 Auto-buscar cuando se selecciona un producto
      setTimeout(() => {
        this.getAllAndSearchKardex(1, this.rows());
      }, 100);
    } else {
      this.clearSelectProduct();
    }
  }

  // 🆕 Evento de filtro del dropdown
  filterProduct(event: any): void {
    this.dropdownFilter.set(event.filter);
    this.loadDropdownProducts(true);
  }

  // 🆕 Evento de scroll infinito (carga perezosa)
  onLazyLoad(event: LazyLoadEvent): void {
    if (this.dropdownProducts().length < this.totalProducts() &&
        !this.loadingSearchProduct()) {
      this.dropdownPage.update(page => page + 1);
      this.loadDropdownProducts();
    }
  }

  // ===== MÉTODOS EXISTENTES MODIFICADOS =====

  getAllAndSearchKardex(page: number, limit: number,type: string = '', query: string = '') {
    if(!this.productSelect()) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un producto',
        text: 'Debe seleccionar un producto para consultar el kardex',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.formReport.patchValue({id_sucursal:this.validatorsService.id_sucursal()});
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();

    if(!query) {this.loading.set(true);}

    this.kardexService.getAllAndSearchKardex(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.kardexes.set(resp.kardexes);
        this.kardexes()!.data.forEach((kardex) => {
          kardex.options =  [
            {
              label:'',icon:'fas fa-eye',
              tooltip: 'Ver',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => this.openKardexMovement(kardex),
            }
          ]
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  private openKardexMovement(kardex: Kardex): void {
    switch (kardex.type_movement) {
      case 'INPUT':
        this.loadMovementDocument(this.inputsService.getInputById(kardex.id_movement), ({ input }) => {
          this.inputsService.detailsSubs$.next(input);
          this.inputsService.showModalDetailsInput = true;
        });
        return;
      case 'OUTPUT':
        this.loadMovementDocument(this.outputService.getOutputById(kardex.id_movement), ({ output }) => {
          this.outputService.detailsSubs$.next(output);
          this.outputService.showModalDetailsInput = true;
        });
        return;
      case 'CLASIFIED':
        this.loadMovementDocument(this.classifiedService.getClassifiedById(kardex.id_movement), ({ classified }) => {
          this.classifiedService.detailsSubs$.next(classified);
          this.classifiedService.showModalDetailsClassified = true;
        });
        return;
      case 'TRANSFER':
        this.openTransferDocument(kardex.id_movement);
        return;
      case 'KMOVEMENT': {
        const transferId = this.getSourceTransferId(kardex);
        if (transferId) {
          this.openTransferDocument(transferId);
          return;
        }
        void Swal.fire({
          icon: 'info',
          title: 'Movimiento de Kardex',
          text: `Este movimiento no tiene una boleta asociada. Registro: ${kardex.registry_number || 'sin número'}.`,
          confirmButtonText: 'Cerrar',
        });
        return;
      }
      default:
        void Swal.fire({
          icon: 'info',
          title: 'Documento no disponible',
          text: `No se reconoce el tipo de movimiento ${kardex.type_movement || 'sin tipo'}.`,
          confirmButtonText: 'Cerrar',
        });
    }
  }

  private openTransferDocument(transferId: string | number): void {
    this.loadMovementDocument(this.transfersService.getTransferById(String(transferId)), ({ transfer }) => {
      this.transfersService.detailsSubs$.next(transfer);
      this.transfersService.showModalDetailsTransfer = true;
    });
  }

  private getSourceTransferId(kardex: Kardex): string | null {
    if (kardex.source_transfer_id) return String(kardex.source_transfer_id);
    const sourceType = kardex.source_type || '';
    const sourceId = String(kardex.source_id || '');
    if (['TRANSFER_RECEPTION', 'TRANSFER_RECEPTION_CANCELLATION', 'TRANSFER_CANCELLATION'].includes(sourceType)
      && /^\d+$/.test(sourceId)) {
      return sourceId;
    }
    const cancelledTransfer = sourceType === 'REVERSAL'
      ? sourceId.match(/^TRANSFER_(?:CANCELLATION|RECEPTION_CANCELLATION):(\d+)$/)
      : null;
    return cancelledTransfer?.[1] || null;
  }

  private loadMovementDocument<T>(request: Observable<T>, onLoaded: (response: T) => void): void {
    void Swal.fire({
      title: 'Estamos cargando los datos',
      html: 'Un momento, por favor.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
    request.subscribe({
      next: (response) => {
        Swal.close();
        onLoaded(response);
      },
      error: (error) => {
        Swal.close();
        const message = error?.error?.errors?.[0]?.msg || 'No se pudo abrir el comprobante del movimiento.';
        void Swal.fire({ icon: 'error', title: 'No se pudo abrir la boleta', text: message, confirmButtonText: 'Cerrar' });
      },
    });
  }

  findProduct(idProduct: number){
    this.loading.set(true);
    this.productService.getOneProduct(idProduct)
        .subscribe({
          next: (resp) => {
            if(resp.product){
              this.selectProduct(resp.product);
              this.getAllAndSearchKardex(1,this.rows())
            }
          },
          error: () => this.loading.set(false)
        });
  }

  selectProduct(product: Product) {
    this.suggestedProducts.set([]);
    this.productSelect.set(product);
    this.productSelectValue = product; // 🆕 Actualizar para el dropdown
    this.formReport.patchValue({
      id_product: product.id
    });
    console.log('✓ Producto establecido:', product.cod, product.name);
  }

  clearSelectProduct() {
    console.log('Limpiando producto seleccionado');

    this.productSelect.set(undefined);
    this.productSelectValue = null;
    this.formReport.patchValue({
      id_product: ''
    });

    // Limpiar kardex
    this.kardexes.set(undefined);

    console.log('✓ Producto limpiado');

    // Recargar dropdown
    this.dropdownFilter.set('');
    this.dropdownPage.set(1);
    this.loadDropdownProducts(true);
  }

  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal, id_provider, id_product ,id_storage, dates} = this.formReport.value;
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY';
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';

      const newParams = {
        type_kardex: params.type_kardex,
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_storage : id_storage ? id_storage : '',
        id_provider: id_provider ? id_provider : '',
        id_product : id_product ? id_product : '',
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
      };

      console.log('Parámetros formados:', newParams);
      return newParams;
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
      this.formReport.get('dates')?.setValue([new Date('2020-01-01'), new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  getAllProviders() {
    this.providersService.getAllAndSearch(1,10000,true).subscribe({
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
    if(!this.productSelect()) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un producto',
        text: 'Debe seleccionar un producto para generar el reporte',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();

    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          this.pdfActions.prepareRequest(this.kardexService.getReportPdfExistencia(this.paramsSearch(),this.fieldSort(),this.order())).subscribe({
            next: (data) => {
              this.pdfActions.show(data, 'kardex-de-existencias.pdf', 'Kardex de existencias');
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
    if(!this.productSelect()) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un producto',
        text: 'Debe seleccionar un producto para generar el reporte',
        confirmButtonText: 'OK'
      });
      return;
    }

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
              downloadBlobFile(data, 'KARDEX DE EXISTENCIAS.xlsx');
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
      filterBy: 'RANGE',
      dates: [new Date('2020-01-01'), new Date()],
      id_sucursal: this.validatorsService.id_sucursal(),
      id_provider: '',
      type_kardex: '',
      id_storage: this.validatorsService.id_storage() || '',
      id_product: '',
    });

    this.clearSelectProduct();
  }
}
