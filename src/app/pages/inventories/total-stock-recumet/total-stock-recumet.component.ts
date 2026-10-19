import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormSearchKardex, Kardexes } from '../interfaces/kardex.interface';
import { KardexService } from '../services/kardex.service';
import * as moment from 'moment';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { DecimalPipe } from '@angular/common';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { MenuItem } from 'primeng/api';
import Swal from 'sweetalert2';
import { CategoriesService } from '../services/categories.service';
import { ProductsService } from '../services/products.service';
import { forkJoin, finalize, Observable, Subscription, from, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProvidersService } from '../../inputs/services/providers.service';
import { Provider, TypesProvider } from '../../inputs/interfaces/provider.interface';
import { PdfDocumentActionsService } from 'src/app/core/services/pdf-document-actions.service';

@Component({
  selector: 'app-total-stock-recumet',
  templateUrl: './total-stock-recumet.component.html',
  styleUrls: ['./total-stock-recumet.component.scss'],
})
export class TotalStockRecumetComponent implements OnInit {
  fb = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  kardexService = inject(KardexService);
  activatedRoute = inject(ActivatedRoute);
  sucursalService = inject(SucursalesService);
  authService = inject(AuthService);
  categoriesService = inject(CategoriesService);
  productService = inject(ProductsService);
  pdfActions = inject(PdfDocumentActionsService);

  private destroyRef = inject(DestroyRef);
  private stockRequest?: Subscription;
  private providerRequest?: Subscription;
  exporting = signal(false);
  loadingProviderTypes = signal(true);
  providersService = inject(ProvidersService);
  providerTypes = signal<TypesProvider[]>([]);
  providers = signal<Provider[]>([]);
  loadingProviders = signal(false);
  loading = signal(false);
  rows = signal(50);
  page = signal(1);
  type = signal('');
  query = signal('');
  kardexes = signal<Kardexes | undefined>(undefined);
  dropdownSucursales = signal<Sucursal[]>([]);
  filteredStorages = signal<any[]>([]);

  // Category selection properties
  dropdownCategories = signal<{ id: number, name: string }[]>([]);
  selectedCategoryIds = signal<number[]>([]);
  loadingCategories = signal(false);
  selectedCategoryValues: number[] = [];

  // Product selection properties
  dropdownProducts = signal<any[]>([]);
  selectedProductIds = signal<number[]>([]);
  selectedProductValues: number[] = [];
  loadingProducts = signal(false);

  buttonItems: MenuItem[] = [
    {
      label: 'Resumen de stock',
      icon: 'fa-regular fa-file-pdf',
      iconStyle: { color: 'var(--color-danger)' },
      command: () => {
        this.printPdfReport();
      },
    },
    {
      label: 'Listado de stock',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { color: 'var(--color-success)' },
      command: () => {
        this.printExcelReport();
      },
    },
    {
      label: 'Consolidado de inventario',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { color: 'var(--color-success)' },
      command: () => {
        this.downloadConsolidatedExcelReport();
      },
    },
    {
      label: 'Compras por sucursal',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { color: 'var(--color-success)' },
      command: () => this.downloadConsolidatedExcelReport(true),
    },
  ];

  loadProviders(): void {
    this.providerRequest?.unsubscribe();
    this.providers.set([]);
    this.formReport.patchValue({ id_provider: '' });
    this.loadingProviders.set(true);
    this.providerRequest = this.kardexService.getStockProviderOptions(String(this.formReport.get('id_type_provider')?.value || '')).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingProviders.set(false))).subscribe({
      next: response => { this.providers.set(response.providers); this.loadingProviders.set(false); },
      error: () => { this.providers.set([]); this.loadingProviders.set(false); Swal.fire('Error', 'No se pudieron cargar los proveedores.', 'error'); }
    });
  }

  title = signal('CONSOLIDADO DE STOCK (MP Y PT) RECUMET');

  paramsSearch = signal<FormSearchKardex>({
    filterBy: 'RANGE',
    date1: '',
    date2: '',
    id_product: '',
    id_provider: '',
    id_storage: '',
    id_sucursal: '',
    type_kardex: '',
    include_zero: false,
  });

  types_filtrado = signal([
    { name: 'DIA', code: 'DAY' },
    { name: 'MES', code: 'MONTH' },
    { name: 'AÑO', code: 'YEAR' },
    { name: 'RANGO', code: 'RANGE' },
  ]);

  formReport: UntypedFormGroup = this.fb.group({
    filterBy: ['RANGE'],
    dates: [[new Date('2025-01-01'), new Date()], [Validators.required]],
    type_kardex: [''],
    id_sucursal: [[], [Validators.required]],
    id_storage: [[]],
    id_provider: [''],
    id_type_provider: [''],
    showZeroSaldo: [false]
  });

  pipeNumber = new DecimalPipe('en-US');
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  cols = signal<ColsTable[]>([
    {
      field: 'index',
      header: 'Nº',
      style: 'min-width:50px;max-width:50px;text-align: center;',
      isIndex: true,
      activeSortable: false,
    },
    {
      field: 'product.cod',
      header: 'CÓDIGO',
      style: 'min-width:100px;max-width:100px;',
      tooltip: true,
      isLink: true,
      link: '/inventories/kardex-existencia?p=${value}',
      field2: 'id_product',
    },
    {
      field: 'product.name',
      header: 'DETALLE',
      style: 'min-width:180px;max-width:180px;',
      tooltip: true,
      isText: true,
    },
    {
      field: 'product.unit.siglas',
      header: 'UND',
      style: 'min-width:80px;max-width:80px;',
      tooltip: true,
      isText: true,
    },
    {
      field: 'quantity_saldo',
      header: 'SALDO',
      style: 'min-width:100px;max-width:120px;text-align: center;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.pipeNumber.transform(val, this.decimal()),
    },
  ]);

  fieldSort = signal('product.cod');
  order = signal('ASC');

  ngOnInit(): void {
    this.formReport.patchValue({
      filterBy: 'RANGE',
      dates: [new Date('2025-01-01'), new Date()],
      id_sucursal: [this.validatorsService.id_sucursal()]
    });

    const idStorage = this.validatorsService.id_storage();
    this.formReport.patchValue({ id_storage: idStorage ? [idStorage] : [] });

    this.providersService.getAllTypesProvider().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingProviderTypes.set(false))).subscribe({
      next: response => this.providerTypes.set(response.typesProvider),
      error: () => Swal.fire('Error', 'No se pudieron cargar los tipos de proveedor.', 'error')
    });
    this.loadProviders();
    this.getSucursales();
    this.loadCategories();
    this.loadDropdownProducts(true);
    this.getAllAndSearchKardex(1, this.rows());
  }

  getSucursales() {
    this.sucursalService.getAllAndSearch(1, 100, true).subscribe({
      next: (resp) => {
        let list = resp.sucursales.data;
        if (this.authService.getUser?.role !== 'ADMINISTRADOR') {
          list = list.filter((sucursal: Sucursal) =>
            this.authService.getUser?.assign_sucursales!.some((resp) => sucursal.id === resp.id_sucursal)
          );
        }
        this.dropdownSucursales.set(list);
        this.onSucursalesChange();
      },
      error: (err) => {
        console.error('Error cargando sucursales:', err);
      }
    });
  }

  onSucursalesChange() {
    const selectedIds: number[] = this.formReport.get('id_sucursal')?.value || [];
    const allSucursales = this.dropdownSucursales();
    const activeStorages: any[] = [];
    allSucursales.forEach(sucursal => {
      if (selectedIds.includes(sucursal.id!)) {
        if (sucursal.storage) {
          activeStorages.push(...sucursal.storage);
        }
      }
    });
    this.filteredStorages.set(activeStorages);

    const currentStorages: number[] = this.formReport.get('id_storage')?.value || [];
    const validStorages = currentStorages.filter(id => activeStorages.some(s => s.id === id));
    this.formReport.patchValue({ id_storage: validStorages });
  }

  loadCategories(): void {
    this.loadingCategories.set(true);
    this.selectedCategoryIds.set([]);
    this.selectedCategoryValues = [];
    this.selectedProductIds.set([]);
    this.selectedProductValues = [];
    this.dropdownProducts.set([]);

    forkJoin({
      rawMaterial: this.categoriesService.getInventoryCategorySelect('RAW_MATERIAL'),
      finishedProduct: this.categoriesService.getInventoryCategorySelect('FINISHED_PRODUCT')
    }).subscribe({
      next: (resp: any) => {
        const raw = resp.rawMaterial.categories || [];
        const finished = resp.finishedProduct.categories || [];
        const combined = [...raw, ...finished];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        this.dropdownCategories.set(unique);
        this.loadingCategories.set(false);
      },
      error: () => {
        this.loadingCategories.set(false);
      }
    });
  }

  onCategoryChange(selectedIds: number[]): void {
    this.selectedCategoryIds.set(selectedIds);
    this.selectedCategoryValues = [...selectedIds];

    this.selectedProductIds.set([]);
    this.selectedProductValues = [];

    this.loadDropdownProducts(true);
  }

  loadDropdownProducts(reset: boolean = false): void {
    if (reset) {
      this.dropdownProducts.set([]);
    }
    this.loadingProducts.set(true);

    const categoryIds =
      this.selectedCategoryIds().length > 0
        ? this.selectedCategoryIds().join(',')
        : '';

    this.productService.getInventorySelectProducts('', 5000, '', categoryIds).subscribe({
      next: (resp: any) => {
        const products = resp.products || [];
        this.dropdownProducts.set(products);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
      }
    });
  }

  onProductChange(selectedIds: number[]): void {
    this.selectedProductIds.set(selectedIds);
    this.selectedProductValues = [...selectedIds];
  }

  getAllAndSearchKardex(page: number, limit: number, type: string = '', query: string = '') {
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid) return;

    this.formParamsByForm();

    this.stockRequest?.unsubscribe();
    this.loading.set(true);

    this.stockRequest = this.kardexService.getTotalStockRecumet(
      page,
      limit,
      this.paramsSearch(),
      type,
      query,
      this.fieldSort(),
      this.order()
    ).subscribe({
      next: (resp) => {
        const startNum = ((page - 1) * Number(limit)) + 1;
        resp.kardexes.data.forEach((item: any, idx: number) => {
          item.index = startNum + idx;
        });

        this.kardexes.set(resp.kardexes);
      },
      complete: () => this.loading.set(false),
      error: (err) => {
        console.error('Error cargando stock consolidado:', err);
        this.loading.set(false);
      }
    });
  }

  formParamsByForm(): void {
    this.paramsSearch.update((params) => {
      const {
        filterBy,
        id_sucursal,
        id_storage,
        dates,
        showZeroSaldo
      } = this.formReport.value;

      const formatDate1 =
        filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY';
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';

      const sucursalIdsStr = Array.isArray(id_sucursal) ? id_sucursal.join(',') : (id_sucursal || '');
      const storageIdsStr = Array.isArray(id_storage) ? id_storage.join(',') : (id_storage || '');
      const categoryIdsStr = this.selectedCategoryIds().length > 0 ? this.selectedCategoryIds().join(',') : '';
      const productIdsStr = this.selectedProductIds().length > 0 ? this.selectedProductIds().join(',') : '';

      const newParams = {
        type_kardex: '',
        id_sucursal: '',
        id_sucursales: sucursalIdsStr,
        id_storage: '',
        id_storages: storageIdsStr,
        category_ids: categoryIdsStr,
        id_products: productIdsStr,
        id_provider: String(this.formReport.get('id_provider')?.value || ''),
        id_type_provider: String(this.formReport.get('id_type_provider')?.value || ''),
        id_product: '',
        filterBy: filterBy,
        date1:
          filterBy == 'RANGE'
            ? moment(dates[0]).format(formatDate1)
            : moment(dates).format(formatDate1),
        date2:
          filterBy == 'RANGE'
            ? dates[1]
              ? moment(dates[1]).format(formatDate1)
              : ''
            : moment(dates).format(formatDate2),
        showZeroSaldo: showZeroSaldo
      };

      console.log('Parámetros formados:', newParams);
      return newParams;
    });
  }

  paginate($rows: any) {
    const { rows, page } = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchKardex(this.page(), this.rows(), this.type(), this.query());
  }

  customSort($sort: any) {
    let { field, order } = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
    this.getAllAndSearchKardex(this.page(), this.rows(), this.type(), this.query());
  }

  search($query: any) {
    const { type, query } = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchKardex(1, this.rows(), this.type(), this.query());
  }

  onChangeTypesFilter() {
    const type_filter = this.formReport.get('filterBy')?.value;
    if (type_filter == 'RANGE') {
      this.formReport.get('dates')?.setValue([new Date('2025-01-01'), new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  clearInputs() {
    this.formReport.patchValue({
      filterBy: 'RANGE',
      dates: [new Date('2025-01-01'), new Date()],
      id_sucursal: [this.validatorsService.id_sucursal()],
      id_storage: this.validatorsService.id_storage() ? [this.validatorsService.id_storage()] : [],
      id_provider: '',
      id_type_provider: '',
      showZeroSaldo: false,
    });
    this.selectedCategoryIds.set([]);
    this.selectedCategoryValues = [];
    this.selectedProductIds.set([]);
    this.selectedProductValues = [];
    this.onSucursalesChange();
    this.loadProviders();
    this.loadDropdownProducts(true);
    this.getAllAndSearchKardex(1, this.rows());
  }

  private exportPdf(request: Observable<Blob>): void {
    this.exporting.set(true);
    this.pdfActions.prepareRequest(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(data => from(this.pdfActions.show(data, 'reporte_stock_total.pdf', 'Reporte de stock total'))),
      finalize(() => this.exporting.set(false)),
    ).subscribe({
      error: () => Swal.fire('Error al generar PDF', 'No se pudo generar el PDF. Intente nuevamente.', 'error'),
    });
  }

  private exportExcel(request: Observable<Blob>, filename: string): void {
    this.exporting.set(true);
    request.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.exporting.set(false)),
    ).subscribe({
      next: file => this.downloadExcel(file, filename),
      error: () => Swal.fire('Error al generar Excel', 'No se pudo generar el Excel. Intente nuevamente.', 'error'),
    });
  }

  private downloadExcel(file: Blob, filename: string): void {
    if (!(file instanceof Blob) || file.size === 0) {
      void Swal.fire('Excel vacío', 'El servidor no devolvió contenido para el reporte. Revise los filtros e intente nuevamente.', 'warning');
      return;
    }

    void file.slice(0, 4).arrayBuffer().then(buffer => {
      const signature = new Uint8Array(buffer);
      const isZip = signature[0] === 0x50 && signature[1] === 0x4b
        && ((signature[2] === 0x03 && signature[3] === 0x04)
          || (signature[2] === 0x05 && signature[3] === 0x06)
          || (signature[2] === 0x07 && signature[3] === 0x08));
      if (!isZip) {
        void Swal.fire('Excel no válido', 'El servidor no devolvió un archivo Excel válido. Verifique que el backend esté actualizado e intente nuevamente.', 'error');
        return;
      }

      const excel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ? file
        : new Blob([file], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(excel);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }).catch(() => {
      void Swal.fire('Excel no válido', 'No se pudo leer el archivo Excel generado. Intente nuevamente.', 'error');
    });
  }

  printPdfReport(): void {
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid || this.exporting()) return;
    this.formParamsByForm();
    this.exportPdf(this.kardexService.getReportPdfTotalStock(this.paramsSearch(), this.type(), this.query(), this.fieldSort(), this.order()));
  }

  printExcelReport(): void {
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid || this.exporting()) return;
    this.formParamsByForm();
    this.exportExcel(this.kardexService.getReportExcelTotalStock(this.paramsSearch(), this.type(), this.query(), this.fieldSort(), this.order()), 'listado_stock_' + this.getDatePartForFilename() + '.xlsx');
  }

  getDatePartForFilename(): string {
    const filterBy = this.formReport.get('filterBy')?.value;
    const dates = this.formReport.get('dates')?.value;
    if (filterBy === 'RANGE' && Array.isArray(dates)) {
      return moment(dates[1] || dates[0]).format('YYYY-MM-DD');
    }
    if (filterBy === 'MONTH') {
      return moment(dates).endOf('month').format('YYYY-MM-DD');
    }
    if (filterBy === 'YEAR') {
      return moment(dates).endOf('year').format('YYYY-MM-DD');
    }
    return moment(dates).format('YYYY-MM-DD');
  }

  downloadConsolidatedExcelReport(purchasesByBranch = false): void {
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid || this.exporting()) return;
    this.formParamsByForm();
    const method = purchasesByBranch ? 'getReportExcelPurchasesByBranch' : 'getReportExcelConsolidatedTotalStock';
    const filename = purchasesByBranch ? 'reporte_compras_x_sucursal' : 'consolidado_inventario';
    this.exportExcel(this.kardexService[method](this.paramsSearch(), this.type(), this.query(), this.fieldSort(), this.order()), filename + '_' + this.getDatePartForFilename() + '.xlsx');
  }

  getSucursalesList(): any[] {
    return Object.values(this.kardexes()?.sucursalTotals || {});
  }
}
