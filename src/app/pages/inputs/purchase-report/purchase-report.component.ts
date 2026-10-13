import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { AuthService } from 'src/app/auth/auth.service';
import * as moment from 'moment';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { CategoriesService } from 'src/app/pages/inventories/services/categories.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import { FormSearchInputs, Input, Inputs } from '../interfaces/input.interface';
import { InputsService } from '../services/inputs.service';
import Swal from 'sweetalert2';
import { Subject, Subscription, debounceTime, finalize, take } from 'rxjs';
import { PdfDocumentActionsService } from 'src/app/core/services/pdf-document-actions.service';

@Component({ selector: 'app-purchase-report', templateUrl: './purchase-report.component.html', styleUrls: ['./purchase-report.component.scss'] })
export class PurchaseReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly validatorsService = inject(ValidatorsService);
  private inputsService = inject(InputsService);
  private pdfActions = inject(PdfDocumentActionsService);
  private sucursalesService = inject(SucursalesService);
  private categoriesService = inject(CategoriesService);
  private productsService = inject(ProductsService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private providerSearch = new Subject<{ query: string; branch: number | undefined }>();
  private providerSubscription?: Subscription;

  loading = signal(false); rows = signal(50); page = signal(1); type = signal(''); query = signal('');
  inputs = signal<Inputs | undefined>(undefined);
  branches = signal<Sucursal[]>([]); storages = signal<any[]>([]);
  categories = signal<any[]>([]); products = signal<any[]>([]);
  providerTypes = signal<any[]>([]); providers = signal<any[]>([]); loadingProviders = signal(false);
  private providerRequestVersion = 0;
  fieldSort = signal('date_voucher'); order = signal('DESC');
  private paymentType = signal('');
  private status = signal('ACTIVE');
  private catalogRequestVersion = 0;
  private readonly numberPipe = new DecimalPipe('en-US');
  readonly filterTypes = [{ name: 'Día', code: 'DAY' }, { name: 'Mes', code: 'MONTH' }, { name: 'Año', code: 'YEAR' }, { name: 'Rango', code: 'RANGE' }];
  form: UntypedFormGroup = this.fb.group({ filterBy: ['MONTH'], dates: [new Date(), Validators.required], id_sucursal: [[], Validators.required], id_storage: [[]], category_ids: [[]], id_products: [[]], id_type_provider: [''], id_provider: [''] });
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'CÓDIGO', footer: 'TOTALES DEL PERÍODO', style: 'min-width:150px;max-width:165px', tooltip: true },
    {
      field: 'type_registry',
      field2: 'registry_number',
      header: 'TIPO DOC.',
      style: 'min-width:130px;max-width:150px;',
      tooltip: true,
      isDocument: true
    },
    { field: 'date_voucher', header: 'FECHA CMP.', style: 'min-width:115px;max-width:115px', tooltip: true, isDate: true },
    { field: 'provider.full_names', header: 'PROVEEDOR', style: 'min-width:170px;max-width:220px', tooltip: true, isText: true },
    { field: 'comments', header: 'OBSERVACIONES', style: 'min-width:170px;max-width:250px', tooltip: true, isText: true },
    { field: 'total_quantity', header: 'CANTIDAD', style: 'min-width:100px;max-width:110px', tooltip: true, isTag: true, tagValue: (value: number) => this.numberPipe.transform(value, '1.2-2') || '0', tagColor: () => 'warning', tagIcon: () => 'fas fa-boxes-stacked' },
    { field: 'kg_purchase_price', header: 'PRECIO COMPRA / KG', footer: 'TOTAL', style: 'min-width:130px;max-width:145px', tooltip: true, isTag: true, tagValue: (value: number | null) => value === null ? '—' : this.numberPipe.transform(value, '1.2-2') || '0', tagColor: () => 'success', tagIcon: () => 'fa-solid fa-scale-balanced', activeSortable: false },
    { field: 'kg_total', header: 'TOTAL COMPRA KG', footer: '0', style: 'min-width:130px;max-width:145px', tooltip: true, isTag: true, tagValue: (value: number) => this.numberPipe.transform(value, '1.2-2') || '0', tagColor: () => 'primary', tagIcon: () => 'fa-solid fa-sack-dollar', activeSortable: false },
    { field: 'total', header: 'TOTAL COMPRA', footer: '0', style: 'min-width:110px;max-width:120px', tooltip: true, isTag: true, tagValue: (value: number) => this.numberPipe.transform(value, '1.2-2') || '0', tagColor: () => 'primary', tagIcon: () => 'fa-solid fa-sack-dollar' },
    { field: 'type', header: 'TIPO', style: 'min-width:90px;max-width:90px', tooltip: true, isTag: true, tagValue: (value: string) => value, tagColor: (value: string) => value === 'CONTADO' ? 'primary' : 'success', tagIcon: () => 'fa-solid fa-sack-dollar' },
    { field: 'options', header: 'OPCIONES', style: 'min-width:90px;max-width:90px', isButton: true },
  ]);
  searchFor = signal<SearchFor[]>([{ name: 'Código', code: 'cod' }, { name: 'Proveedor', code: 'provider.full_names' }]);
  readonly tabs: MenuItem[] = [
    { label: 'Todos', icon: 'fas fa-list', command: () => this.selectTab('', 'ACTIVE') },
    { label: 'Al contado', icon: 'fa-solid fa-circle-check', command: () => this.selectTab('CONTADO', 'ACTIVE') },
    { label: 'A crédito', icon: 'fa-solid fa-clock-rotate-left', command: () => this.selectTab('CREDITO', 'ACTIVE') },
    { label: 'Anulados', icon: 'fa-solid fa-trash-can', command: () => this.selectTab('', 'INACTIVE') },
  ];
  readonly excelReports: MenuItem[] = [
    { label: 'Sucursal x producto x proveedor', icon: 'fa-solid fa-users', command: () => this.exportBranchProductProvider() },
    { label: 'Compras detalle por proveedor', icon: 'fa-solid fa-users', command: () => this.export('excel') },
    { label: 'Resumen por producto', icon: 'fa-solid fa-boxes-stacked', command: () => this.exportProductSummaryExcel() },
    { label: 'Inventario consolidado', icon: 'fa-solid fa-warehouse', command: () => this.exportConsolidatedInventoryExcel() },
  ];
  readonly pdfReports: MenuItem[] = [
    { label: 'Compras detalle por proveedor', icon: 'fa-solid fa-print', command: () => this.export('pdf') },
    { label: 'Resumen por producto', icon: 'fa-solid fa-boxes-stacked', command: () => this.exportReportDetails('pdf') },
    { label: 'Detalle costo promedio', icon: 'fa-solid fa-chart-pie', command: () => this.exportReportDetails('cpp') },
  ];
  activeTab = signal<MenuItem | undefined>(undefined);

  ngOnInit(): void {
    this.providerSearch.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef)).subscribe(search => {
      if (search.branch === this.form.value.id_sucursal?.[0]) this.loadProviders(search.query, false);
    });
    this.activeTab.set(this.tabs[0]); this.loadOperationalDate();
  }
  filterProviders(query: string): void { this.providerSearch.next({ query, branch: this.form.value.id_sucursal?.[0] }); }
  loadProviders(query = '', resetSelection = true): void {
    if (resetSelection) this.form.patchValue({ id_provider: '' });
    this.providerSubscription?.unsubscribe();
    const version = ++this.providerRequestVersion;
    if (resetSelection) this.providers.set([]);
    const branch = this.form.value.id_sucursal?.[0];
    if (!branch) { this.providers.set([]); this.loadingProviders.set(false); return; }
    this.loadingProviders.set(true);
    this.providerSubscription = this.inputsService.getPurchaseProviderCatalog(String(this.form.value.id_type_provider || ''), query, String(branch)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (version !== this.providerRequestVersion) return;
        const selected = this.providers().find(item => item.id === this.form.value.id_provider);
        const providers = result.providers || [];
        this.providers.set(selected && !providers.some((item: any) => item.id === selected.id) ? [selected, ...providers] : providers);
        this.providerTypes.set(result.types || []); this.loadingProviders.set(false);
      },
      error: () => { if (version !== this.providerRequestVersion) return; this.providers.set([]); this.loadingProviders.set(false); Swal.fire('Atención', 'No se pudieron cargar los proveedores.', 'error'); },
    });
  }
  exportBranchProductProvider(): void {
    this.form.markAllAsTouched(); if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.inputsService.getPurchaseProviderDetailsExcel(this.params(), this.type(), this.query()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: file => {
        const url = URL.createObjectURL(file), anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'sucursal_x_producto_x_proveedor.xlsx';
        document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      },
      error: () => Swal.fire('Atención', 'No se pudo generar el reporte de compras por proveedor.', 'error'),
    });
  }
  private loadOperationalDate(): void { this.inputsService.getOperationalDate().subscribe({ next: response => { this.form.patchValue({ dates: new Date(response.date) }); this.loadBranches(); }, error: () => this.loadBranches() }); }
  loadBranches(): void { this.sucursalesService.getAllAndSearch(1, 500, true).subscribe({ next: r => { const user = this.authService.getUser; const permitted = user.role === 'ADMINISTRADOR' ? r.sucursales.data : r.sucursales.data.filter(branch => user.assign_sucursales?.some(assigned => assigned.id_sucursal === branch.id)); this.branches.set(permitted); const currentBranch = this.validatorsService.id_sucursal(); const initialBranch = permitted.some(branch => branch.id === currentBranch) ? currentBranch : permitted[0]?.id; this.form.patchValue({ id_sucursal: initialBranch ? [initialBranch] : [] }); this.onBranchChange(); this.search(); } }); }
  private selectedBranchId(): number | undefined { return (this.form.value.id_sucursal || [])[0] || this.validatorsService.id_sucursal(); }
  loadCategories(): void {
    const branchId = this.selectedBranchId();
    const requestVersion = this.catalogRequestVersion;
    this.categoriesService.getCategorySelect('', ProductAccessContext.Purchases, branchId).subscribe({
      next: r => { if (requestVersion === this.catalogRequestVersion) this.categories.set(r.categories || []); },
      error: () => { if (requestVersion === this.catalogRequestVersion) this.categories.set([]); },
    });
  }
  onBranchChange(): void {
    this.loadProviders();
    this.catalogRequestVersion += 1;
    const ids = this.form.value.id_sucursal || [];
    const available = this.branches().filter(branch => ids.includes(branch.id)).flatMap(branch => branch.storage || []).filter((value, index, all) => value.status && all.findIndex(item => item.id === value.id) === index);
    this.storages.set(available);
    this.categories.set([]);
    this.products.set([]);
    const currentStorage = this.validatorsService.id_storage();
    const retained = (this.form.value.id_storage || []).filter((id: number) => available.some(storage => storage.id === id));
    this.form.patchValue({ id_storage: retained.length ? retained : (available.some(storage => storage.id === currentStorage) ? [currentStorage] : available[0] ? [available[0].id] : []), category_ids: [], id_products: [] });
    this.loadCategories();
    this.loadProducts();
  }
  onCategoryChange(): void { this.form.patchValue({ id_products: [] }); this.loadProducts(); }
  private loadProducts(): void {
    const categories = (this.form.value.category_ids || []).join(',');
    const branchId = this.selectedBranchId();
    const requestVersion = this.catalogRequestVersion;
    this.productsService.getSelectProducts('', 5000, '', categories, ProductAccessContext.Purchases, branchId).subscribe({
      next: r => { if (requestVersion === this.catalogRequestVersion) this.products.set(r.products || []); },
      error: () => { if (requestVersion === this.catalogRequestVersion) this.products.set([]); },
    });
  }
  onFilterChange(): void { this.form.patchValue({ dates: this.form.value.filterBy === 'RANGE' ? [new Date(new Date().getFullYear(), 0, 1), new Date()] : new Date() }); }
  private selectedFilterSummary(): string {
    const values = this.form.value;
    const labels: string[] = [];
    const addSelection = (label: string, items: any[], ids: number[]) => {
      if (ids?.length) labels.push(label + ': ' + items.filter(item => ids.includes(item.id)).map(item => item.name || item.cod).join(', '));
    };
    addSelection('Sucursales', this.branches(), values.id_sucursal);
    addSelection('Almacenes', this.storages(), values.id_storage);
    addSelection('Categorías', this.categories(), values.category_ids);
    addSelection('Productos', this.products(), values.id_products);
    const providerType = this.providerTypes().find(item => item.id === values.id_type_provider);
    const provider = this.providers().find(item => item.id === values.id_provider);
    if (providerType) labels.push('Tipo de proveedor: ' + providerType.name);
    if (provider) labels.push('Proveedor: ' + provider.full_names);
    if (this.paymentType()) labels.push('Pago: ' + this.paymentType());
    labels.push('Estado de compras: ' + (this.status() === 'INACTIVE' ? 'Anuladas' : 'Activas'));
    if (this.query()) labels.push('Búsqueda: ' + this.query());
    return labels.join(' | ');
  }
  private params(): FormSearchInputs { const { filterBy, dates, id_sucursal, id_storage, category_ids, id_products } = this.form.value; const range = filterBy === 'RANGE'; return { status: this.status(), type_pay: this.paymentType(), type_registry: '', id_provider: String(this.form.value.id_provider || ''), referral_sources: '', id_type_provider: String(this.form.value.id_type_provider || ''), old_customer: '', with_pickup: '', filterBy, id_sucursal: (id_sucursal || []).join(','), id_storage: (id_storage || []).join(','), category_ids: (category_ids || []).join(','), id_products: (id_products || []).join(','), report_filters: this.selectedFilterSummary(), date1: moment(range ? dates?.[0] : dates).format(filterBy === 'MONTH' ? 'MM' : filterBy === 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'), date2: range ? (dates?.[1] ? moment(dates[1]).format('DD-MM-YYYY') : '') : moment(dates).format(filterBy === 'MONTH' ? 'YYYY' : 'DD-MM-YYYY') }; }
  search(resetPage = false): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    this.inputsService.getPurchaseReport(this.page(), this.rows(), this.params(), this.type(), this.query(), this.fieldSort(), this.order())
      .pipe(take(1), finalize(() => this.loading.set(false)))
      .subscribe({
        next: response => {
          const result = response?.inputs;
          if (!result) {
            this.inputs.set({ previousPage: null, currentPage: this.page(), nextPage: null, total: 0, total_all: 0, per_page: this.rows(), from: 0, to: 0, data: [], totals: { totalInput: 0, totalQuantity: 0 } });
            return;
          }
          result.data = result.data || [];
          result.data.forEach(input => this.configureOptions(input));
          this.inputs.set({ ...result, totals: result.totals || { totalInput: 0, totalQuantity: 0 } });
        },
        error: () => Swal.fire('Atención', 'No se pudo consultar el reporte de compras.', 'error'),
      });
  }
  private configureOptions(input: Input): void { input.options = [{ label: '', icon: 'fas fa-eye', tooltip: 'Ver detalle', class: 'p-button-rounded p-button-success p-button-sm', eventClick: () => { this.inputsService.detailsSubs$.next(input); this.inputsService.showModalDetailsInput = true; } }]; }
  paginate(event: any): void { this.rows.set(event.rows); this.page.set(event.page); this.search(); }
  customSort(event: any): void { this.fieldSort.set(event.field); this.order.set(event.order); this.search(); }
  tableSearch(event: any): void { this.type.set(event.type); this.query.set(event.query); this.page.set(1); this.search(); }
  selectTab(typePay: string, status: string): void { this.paymentType.set(typePay); this.status.set(status); this.activeTab.set(this.tabs.find(tab => (tab.label === 'Todos' && !typePay && status === 'ACTIVE') || (tab.label === 'Al contado' && typePay === 'CONTADO') || (tab.label === 'A crédito' && typePay === 'CREDITO') || (tab.label === 'Anulados' && status === 'INACTIVE'))); this.page.set(1); this.search(); }
  clear(): void { this.form.patchValue({ filterBy: 'MONTH', dates: new Date(), id_sucursal: this.validatorsService.id_sucursal() ? [this.validatorsService.id_sucursal()] : [], id_storage: [], category_ids: [], id_products: [], id_type_provider: '', id_provider: '' }); this.onBranchChange(); this.onCategoryChange(); this.search(); }
  export(format: 'pdf' | 'excel'): void { if (this.form.invalid) return; this.loading.set(true); const filters = this.params(); const request = format === 'pdf' ? this.inputsService.getPurchaseReportPdf(filters, this.fieldSort(), this.order(), this.type(), this.query()) : this.inputsService.getPurchaseReportExcel(filters, this.fieldSort(), this.order(), this.type(), this.query()); this.pdfActions.prepareRequest(request, format !== 'excel').subscribe({ next: (file: Blob) => format === 'pdf' ? this.pdfActions.show(file, 'reporte_compras_detalle_proveedor.pdf', 'Compras detalle por proveedor') : window.open(URL.createObjectURL(file)), error: () => { this.loading.set(false); Swal.fire('Atención', 'No se pudo generar el reporte.', 'error'); }, complete: () => this.loading.set(false) }); }
  exportProductSummaryExcel(): void { if (this.form.invalid) return; this.loading.set(true); this.inputsService.getPurchaseProductSummaryExcel(this.params(), this.fieldSort(), this.order(), this.type(), this.query()).subscribe({ next: (file: Blob) => window.open(URL.createObjectURL(file)), error: () => { this.loading.set(false); Swal.fire('Atención', 'No se pudo generar el resumen por producto.', 'error'); }, complete: () => this.loading.set(false) }); }
  exportConsolidatedInventoryExcel(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { filterBy, dates } = this.form.value;
    const selectedDate = filterBy === 'RANGE' ? dates?.[1] || dates?.[0] : dates;
    const cutoff = moment(selectedDate);
    if (filterBy === 'MONTH') cutoff.endOf('month');
    if (filterBy === 'YEAR') cutoff.endOf('year');
    this.inputsService.getConsolidatedInventoryExcel(this.params()).subscribe({
      next: (file: Blob) => {
        const url = URL.createObjectURL(file);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `consolidado_inventario_${cutoff.format('YYYY-MM-DD')}.xlsx`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: () => { this.loading.set(false); Swal.fire('Atención', 'No se pudo generar el inventario consolidado.', 'error'); },
      complete: () => this.loading.set(false),
    });
  }
  exportReportDetails(format: 'pdf' | 'excel' | 'cpp'): void { if (this.form.invalid) return; this.loading.set(true); const filters = this.params(); const request = format === 'excel' ? this.inputsService.getPurchaseReportDetailsExcel(filters, this.fieldSort(), this.order(), this.type(), this.query()) : format === 'cpp' ? this.inputsService.getPurchaseReportDetailsCPPPdf(filters, this.fieldSort(), this.order(), this.type(), this.query()) : this.inputsService.getPurchaseReportDetailsPdf(filters, this.fieldSort(), this.order(), this.type(), this.query()); this.pdfActions.prepareRequest(request, format !== 'excel').subscribe({ next: (file: Blob) => format === 'excel' ? window.open(URL.createObjectURL(file)) : this.pdfActions.show(file, format === 'cpp' ? 'reporte_costo_promedio.pdf' : 'reporte_compras_resumen_producto.pdf', format === 'cpp' ? 'Detalle costo promedio' : 'Resumen por producto'), error: () => { this.loading.set(false); Swal.fire('Atención', 'No se pudo generar el reporte.', 'error'); }, complete: () => this.loading.set(false) }); }
}
