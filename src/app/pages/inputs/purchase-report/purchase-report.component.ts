import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({ selector: 'app-purchase-report', templateUrl: './purchase-report.component.html' })
export class PurchaseReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly validatorsService = inject(ValidatorsService);
  private inputsService = inject(InputsService);
  private sucursalesService = inject(SucursalesService);
  private categoriesService = inject(CategoriesService);
  private productsService = inject(ProductsService);
  private authService = inject(AuthService);

  loading = signal(false); rows = signal(50); page = signal(1); type = signal(''); query = signal('');
  inputs = signal<Inputs | undefined>(undefined);
  branches = signal<Sucursal[]>([]); storages = signal<any[]>([]);
  categories = signal<any[]>([]); products = signal<any[]>([]);
  fieldSort = signal('date_voucher'); order = signal('DESC');
  private paymentType = signal('');
  private status = signal('ACTIVE');
  private catalogRequestVersion = 0;
  private readonly numberPipe = new DecimalPipe('en-US');
  readonly filterTypes = [{ name: 'Día', code: 'DAY' }, { name: 'Mes', code: 'MONTH' }, { name: 'Año', code: 'YEAR' }, { name: 'Rango', code: 'RANGE' }];
  form: UntypedFormGroup = this.fb.group({ filterBy: ['MONTH'], dates: [new Date(), Validators.required], id_sucursal: [[], Validators.required], id_storage: [[]], category_ids: [[]], id_products: [[]] });
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'CÓDIGO', style: 'min-width:100px;max-width:100px', tooltip: true },
    { field: 'type_registry', header: 'TIPO DOC.', style: 'min-width:90px;max-width:90px', tooltip: true, isTag: true, tagValue: (value: string) => value, tagColor: () => 'success', tagIcon: () => 'fa-solid fa-file' },
    { field: 'registry_number', header: 'NÚMERO', style: 'min-width:90px;max-width:110px', tooltip: true, isText: true },
    { field: 'date_voucher', header: 'FECHA CMP.', style: 'min-width:115px;max-width:115px', tooltip: true, isDate: true },
    { field: 'provider.full_names', header: 'PROVEEDOR', style: 'min-width:170px;max-width:220px', tooltip: true, isText: true },
    { field: 'comments', header: 'OBSERVACIONES', style: 'min-width:170px;max-width:250px', tooltip: true, isText: true },
    { field: 'total_quantity', header: 'TOTAL KG', style: 'min-width:100px;max-width:110px', tooltip: true, isTag: true, tagValue: (value: number) => this.numberPipe.transform(value, '1.2-2') || '0', tagColor: () => 'warning', tagIcon: () => 'fas fa-boxes-stacked' },
    { field: 'total', header: 'TOTAL', style: 'min-width:100px;max-width:110px', tooltip: true, isTag: true, tagValue: (value: number) => this.numberPipe.transform(value, '1.2-2') || '0', tagColor: () => 'primary', tagIcon: () => 'fa-solid fa-sack-dollar' },
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

  ngOnInit(): void { this.activeTab.set(this.tabs[0]); this.loadOperationalDate(); }
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
  private params(): FormSearchInputs { const { filterBy, dates, id_sucursal, id_storage, category_ids, id_products } = this.form.value; const range = filterBy === 'RANGE'; const names = (items: any[], ids: number[]) => items.filter(item => ids.includes(item.id)).map(item => item.name || item.cod).join(', ') || 'Todos'; return { status: this.status(), type_pay: this.paymentType(), type_registry: '', id_provider: '', referral_sources: '', id_type_provider: '', old_customer: '', with_pickup: '', filterBy, id_sucursal: (id_sucursal || []).join(','), id_storage: (id_storage || []).join(','), category_ids: (category_ids || []).join(','), id_products: (id_products || []).join(','), report_filters: `Sucursales: ${names(this.branches(), id_sucursal || [])} | Almacenes: ${names(this.storages(), id_storage || [])} | Categorías: ${names(this.categories(), category_ids || [])} | Productos: ${names(this.products(), id_products || [])}`, date1: moment(range ? dates?.[0] : dates).format(filterBy === 'MONTH' ? 'MM' : filterBy === 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'), date2: range ? (dates?.[1] ? moment(dates[1]).format('DD-MM-YYYY') : '') : moment(dates).format(filterBy === 'MONTH' ? 'YYYY' : 'DD-MM-YYYY') }; }
  search(resetPage = false): void { this.form.markAllAsTouched(); if (this.form.invalid) return; if (resetPage) this.page.set(1); this.loading.set(true); this.inputsService.getPurchaseReport(this.page(), this.rows(), this.params(), this.type(), this.query(), this.fieldSort(), this.order()).subscribe({ next: r => { r.inputs.data.forEach(input => this.configureOptions(input)); this.inputs.set(r.inputs); }, error: () => { this.loading.set(false); Swal.fire('Atención', 'No se pudo consultar el reporte de compras.', 'error'); }, complete: () => this.loading.set(false) }); }
  private configureOptions(input: Input): void { input.options = [{ label: '', icon: 'fas fa-eye', tooltip: 'Ver detalle', class: 'p-button-rounded p-button-success p-button-sm', eventClick: () => { this.inputsService.detailsSubs$.next(input); this.inputsService.showModalDetailsInput = true; } }]; }
  paginate(event: any): void { this.rows.set(event.rows); this.page.set(event.page); this.search(); }
  customSort(event: any): void { this.fieldSort.set(event.field); this.order.set(event.order); this.search(); }
  tableSearch(event: any): void { this.type.set(event.type); this.query.set(event.query); this.page.set(1); this.search(); }
  selectTab(typePay: string, status: string): void { this.paymentType.set(typePay); this.status.set(status); this.activeTab.set(this.tabs.find(tab => (tab.label === 'Todos' && !typePay && status === 'ACTIVE') || (tab.label === 'Al contado' && typePay === 'CONTADO') || (tab.label === 'A crédito' && typePay === 'CREDITO') || (tab.label === 'Anulados' && status === 'INACTIVE'))); this.page.set(1); this.search(); }
  clear(): void { this.form.patchValue({ filterBy: 'MONTH', dates: new Date(), id_sucursal: this.validatorsService.id_sucursal() ? [this.validatorsService.id_sucursal()] : [], id_storage: [], category_ids: [], id_products: [] }); this.onBranchChange(); this.onCategoryChange(); this.search(); }
  export(format: 'pdf' | 'excel'): void { if (this.form.invalid) return; this.loading.set(true); const filters = this.params(); const request = format === 'pdf' ? this.inputsService.getPurchaseReportPdf(filters, this.fieldSort(), this.order(), this.type(), this.query()) : this.inputsService.getPurchaseReportExcel(filters, this.fieldSort(), this.order(), this.type(), this.query()); request.subscribe({ next: (file: Blob) => window.open(URL.createObjectURL(file)), error: () => Swal.fire('Atención', 'No se pudo generar el reporte.', 'error'), complete: () => this.loading.set(false) }); }
  exportProductSummaryExcel(): void { if (this.form.invalid) return; this.loading.set(true); this.inputsService.getPurchaseProductSummaryExcel(this.params(), this.fieldSort(), this.order(), this.type(), this.query()).subscribe({ next: (file: Blob) => window.open(URL.createObjectURL(file)), error: () => Swal.fire('Atención', 'No se pudo generar el resumen por producto.', 'error'), complete: () => this.loading.set(false) }); }
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
  exportReportDetails(format: 'pdf' | 'excel' | 'cpp'): void { if (this.form.invalid) return; this.loading.set(true); const filters = this.params(); const request = format === 'excel' ? this.inputsService.getPurchaseReportDetailsExcel(filters, this.fieldSort(), this.order(), this.type(), this.query()) : format === 'cpp' ? this.inputsService.getPurchaseReportDetailsCPPPdf(filters, this.fieldSort(), this.order(), this.type(), this.query()) : this.inputsService.getPurchaseReportDetailsPdf(filters, this.fieldSort(), this.order(), this.type(), this.query()); request.subscribe({ next: (file: Blob) => window.open(URL.createObjectURL(file)), error: () => Swal.fire('Atención', 'No se pudo generar el reporte.', 'error'), complete: () => this.loading.set(false) }); }
}
