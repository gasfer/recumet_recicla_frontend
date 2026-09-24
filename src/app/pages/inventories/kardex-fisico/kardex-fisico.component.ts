import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { LazyLoadEvent, MenuItem } from 'primeng/api';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../inputs/services/providers.service';
import { FormSearchKardex, Kardexes } from '../interfaces/kardex.interface';
import { KardexService } from '../services/kardex.service';
import * as moment from 'moment';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import { CategoriesService } from '../services/categories.service';
import { Category, CategoryType } from '../interfaces/categories.interface';
import Swal from 'sweetalert2';
import { DecimalPipe } from '@angular/common';
import { ValuedKardexMovement } from '../interfaces/valued-kardex.interface';

@Component({
  selector: 'app-kardex-fisico',
  templateUrl: './kardex-fisico.component.html',
  styleUrls: ['./kardex-fisico.component.scss'],
})
export class KardexFisicoComponent {
  readonly ALL_HISTORY = 'ALL_HISTORY';
  readonly PHYSICAL_SUMMARY = 'PHYSICAL_SUMMARY';
  fb = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  providersService = inject(ProvidersService);
  kardexService = inject(KardexService);
  productService = inject(ProductsService);
  categoriesService = inject(CategoriesService);
  activatedRoute = inject(ActivatedRoute);


  providers = signal<{ name: string; code: string }[]>([]);
  loading = signal(false);
  rows = signal(50);
  page = signal(1);
  type = signal('');
  query = signal('');
  kardexes = signal<Kardexes | undefined>(undefined);

  // Signals para el dropdown de productos (eliminadas las antiguas)
  loadingSearchProduct = signal(false);
  productSelect = signal<any>(undefined);
  dropdownProducts = signal<{ id: number, name: string, cod: string }[]>([]);
  totalProducts = signal(0);
  dropdownPage = signal(1);
  dropdownLimit = signal(20);
  dropdownFilter = signal('');

  private searchSubject = new Subject<string>();
  private kardexRequest?: Subscription;

  title = signal('CONSULTA DE KARDEX FÍSICO');
  isAllProductsRoute = signal(false);
  activeView = signal(this.PHYSICAL_SUMMARY);
  activeSearchItem = signal<MenuItem | undefined>(undefined);

  // Signals para categorías
  dropdownCategories = signal<{ id: number, name: string }[]>([]);
  selectedCategoryIds = signal<number[]>([]);
  loadingCategories = signal(false);


  // Propiedad para el ngModel del dropdown
  productSelectValue: any = null;
  selectedCategoryValues: number[] = [];

  paramsSearch = signal<FormSearchKardex>({
    filterBy: 'YEAR',
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

  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { color: '#14A44D' },
      command: () => {
        this.printExcelReport();
      },
    },
  ];

  searchItems = signal<MenuItem[]>([]);

  formReport: UntypedFormGroup = this.fb.group({
    filterBy: ['YEAR'],
    dates: [new Date(), [Validators.required]],
    type_kardex: [''],
    id_sucursal: ['', [Validators.required]],
    id_storage: ['', [Validators.required]],
    id_provider: [''],
    id_product: [''],
    showZeroSaldo: [false],
    category_types: ['']
  });

  pipeNumber = new DecimalPipe('es-BO');
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
      field: `product.name`,
      header: 'DETALLE',
      style: 'min-width:180px;max-width:180px;',
      tooltip: true,
      isText: true,
    },
    {
      field: `product.unit.siglas`,
      header: 'UND',
      style: 'min-width:80px;max-width:80px;',
      tooltip: true,
      isText: true,
    },
    {
      field: `quantity_input`,
      header: 'ENTRADA',
      style: 'min-width:100px;max-width:120px;text-align: center;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.pipeNumber.transform(val, this.decimal()),
    },
    {
      field: `quantity_output`,
      header: 'SALIDA',
      style: 'min-width:100px;max-width:120px;text-align: center;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.pipeNumber.transform(val, this.decimal()),
    },
    {
      field: `quantity_saldo`,
      header: 'SALDO',
      style: 'min-width:100px;max-width:120px;text-align: center;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.pipeNumber.transform(val, this.decimal()),
    },
  ]);

  historyCols = signal<ColsTable[]>([
    { field: 'date', header: 'FECHA', style: 'min-width:125px;max-width:140px;', tooltip: true, isDate: true },
    {
      field: 'event_label', header: 'EVENTO', style: 'min-width:135px;max-width:155px;', tooltip: true, isTag: true,
      tagValue: (value: string) => value || 'OTRO MOVIMIENTO',
      tagColor: (value: string) => value === 'REVERSIÓN' ? 'warning' : value.includes('SALIDA') || value.includes('ENVIADO') ? 'danger' : 'success',
      tagIcon: (value: string) => value === 'REVERSIÓN' ? 'fa-solid fa-rotate-left' : value.includes('SALIDA') || value.includes('ENVIADO') ? 'fa-solid fa-arrow-right' : 'fa-solid fa-arrow-left',
    },
    { field: 'registry_number', header: 'DOCUMENTO', style: 'min-width:105px;max-width:125px;', tooltip: true, isText: true },
    {
      field: 'product.cod', header: 'CÓDIGO', style: 'min-width:120px;max-width:140px;', tooltip: true,
      isLink: true, link: '/inventories/kardex-existencia?p=${value}', field2: 'id_product',
    },
    { field: 'product.name', header: 'PRODUCTO', style: 'min-width:190px;max-width:240px;', tooltip: true, isText: true },
    { field: 'detail', field2: 'sub_detail', header: 'DETALLE / ORIGEN', style: 'min-width:210px;max-width:280px;', tooltip: true, isDoubleValue: true },
    { field: 'product.unit.siglas', header: 'UND', style: 'min-width:65px;max-width:75px;text-align:center;', tooltip: true, isText: true },
    { field: 'quantity_input', header: 'ENTRADA', style: 'min-width:105px;max-width:120px;text-align:right;', tooltip: true, isValueUpdate: true, tagValue: (value: number) => this.pipeNumber.transform(value, this.decimal()) },
    { field: 'quantity_output', header: 'SALIDA', style: 'min-width:105px;max-width:120px;text-align:right;', tooltip: true, isValueUpdate: true, tagValue: (value: number) => this.pipeNumber.transform(value, this.decimal()) },
    { field: 'saldo', header: 'SALDO', style: 'min-width:105px;max-width:120px;text-align:right;', tooltip: true, isValueUpdate: true, tagValue: (value: number) => this.pipeNumber.transform(value, this.decimal()) },
  ]);

  fieldSort = signal('product.category.name');
  order = signal('desc');


  ngOnInit(): void {
    this.getAllProviders();
    this.loadDropdownProducts(true);

    this.formReport.patchValue({
      filterBy: 'RANGE',
      dates: [new Date('2025-01-01'), new Date()],
      id_sucursal: this.validatorsService.id_sucursal()
    });

    this.formReport.patchValue({ id_storage: this.validatorsService.id_storage() || '' });

    this.activatedRoute.data.subscribe((data: any) => {
      this.title.set(data.title || 'CONSULTA DE KARDEX FÍSICO');
      const categoryType = data.category_types || '';
      const allProducts = categoryType === '';
      this.isAllProductsRoute.set(allProducts);
      this.configureViews(allProducts);

      this.formReport.patchValue({
        category_types: categoryType
      });

      // Cargar categorías según el tipo de la ruta
      this.loadCategories(categoryType);
      this.getAllAndSearchKardex(1, this.rows());
    });

    // Configurar debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(filterValue => {
      this.dropdownFilter.set(filterValue);
      this.loadDropdownProducts(true);
    });
  }

  private configureViews(allProducts: boolean): void {
    if (!allProducts) {
      this.activeView.set(this.PHYSICAL_SUMMARY);
      this.fieldSort.set('product.category.name');
      this.order.set('ASC');
      const item: MenuItem = { label: 'ENTRADAS Y SALIDAS', icon: 'fa-solid fa-left-right', iconStyle: { color: '#3B71CA' } };
      this.searchItems.set([item]);
      this.activeSearchItem.set(item);
      return;
    }

    this.activeView.set(this.PHYSICAL_SUMMARY);
    this.fieldSort.set('product.category.name');
    this.order.set('ASC');
    const summaryItem: MenuItem = {
      label: 'RESUMEN FÍSICO', icon: 'fa-solid fa-boxes-stacked', iconStyle: { color: '#14A44D' },
      command: () => this.selectView(this.PHYSICAL_SUMMARY),
    };
    this.searchItems.set([summaryItem]);
    this.activeSearchItem.set(summaryItem);
  }

  private selectView(view: string): void {
    this.activeView.set(view);
    this.applyCurrentDayToAllHistory();
    this.page.set(1);
    this.fieldSort.set(view === this.ALL_HISTORY ? 'date' : 'product.category.name');
    this.order.set(view === this.ALL_HISTORY ? 'DESC' : 'ASC');
    const itemIndex = view === this.ALL_HISTORY ? 0 : 1;
    this.activeSearchItem.set(this.searchItems()[itemIndex] ?? this.searchItems()[0]);
    this.getAllAndSearchKardex(1, this.rows(), this.type(), this.query());
  }


  // === MÉTODOS PARA DROPDOWN DE PRODUCTOS ===

  // Método para cargar productos en el dropdown
  loadDropdownProducts(reset: boolean = false): void {

    if (reset) {
      this.dropdownPage.set(1);
      this.dropdownProducts.set([]);
    }

    this.loadingSearchProduct.set(true);

    const categoryType = this.formReport.get('category_types')?.value || '';

    const categoryIds =
      this.selectedCategoryIds().length > 0
        ? this.selectedCategoryIds().join(',')
        : '';

    this.productService.getInventorySelectProducts(
      this.dropdownFilter(),
      this.dropdownLimit(),
      categoryType,
      categoryIds
    ).subscribe({
      next: (resp: any) => {

        const products = resp.products || [];

        if (reset) {
          this.dropdownProducts.set(products);
        } else {
          this.dropdownProducts.update(prev => [...prev, ...products]);
        }

        this.totalProducts.set(products.length);
        this.loadingSearchProduct.set(false);

      },
      error: () => {
        this.loadingSearchProduct.set(false);
      }
    });

  }


  // === MÉTODOS PARA CATEGORÍAS ===

  loadCategories(categoryType: string): void {
    this.loadingCategories.set(true);
    this.selectedCategoryIds.set([]);
    this.selectedCategoryValues = [];
    this.dropdownProducts.set([]);
    this.productSelectValue = null;
    this.productSelect.set(undefined);

    this.categoriesService.getInventoryCategorySelect(categoryType).subscribe({
      next: (resp: any) => {
        const categories = resp.categories || [];
        this.dropdownCategories.set(categories);
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

    // NO limpiar producto seleccionado
    // porque ambos filtros deben poder coexistir

    this.loadDropdownProducts(true);

  }


  // Evento de filtro del dropdown
  filterProduct(event: any): void {
    const query = event.filter || '';
    this.searchSubject.next(query);
  }

  // Evento de scroll infinito (carga perezosa)
  onLazyLoad(event: LazyLoadEvent): void {
    // Verificar si necesitamos cargar más productos
    if (this.dropdownProducts().length < this.totalProducts() &&
      !this.loadingSearchProduct()) {
      this.dropdownPage.update(page => page + 1);
      this.loadDropdownProducts();
    }
  }

  // Limpiar producto seleccionado - VERSIÓN MEJORADA
  clearSelectProduct(): void {
    console.log('Limpiando producto seleccionado');

    this.productSelect.set(undefined);
    this.productSelectValue = null;
    this.formReport.patchValue({
      id_product: ''
    });

    console.log('✓ Producto limpiado, formValue:', this.formReport.get('id_product')?.value);

    // Limpiar el dropdown y recargar
    this.dropdownFilter.set('');
    this.dropdownPage.set(1);
    this.loadDropdownProducts(true);
  }


  // === MÉTODO PARA BUSCAR KARDEX - ASEGURAR QUE USA id_product ===

  getAllAndSearchKardex(
    page: number,
    limit: number,
    type: string = '',
    query: string = '',
  ): void {
    this.applyCurrentDayToAllHistory();
    // Asegurar que el id_sucursal está actualizado
    this.formReport.patchValue({
      id_sucursal: this.validatorsService.id_sucursal(),
    });

    this.formReport.markAllAsTouched();
    if (!this.formReport.valid) {
      console.error('Formulario inválido');
      return;
    }

    // Extraer valores actuales del formulario para debug
    const formValues = this.formReport.value;
    console.log('Formulario valores:', {
      id_product: formValues.id_product,
      id_sucursal: formValues.id_sucursal,
      id_storage: formValues.id_storage,
      filterBy: formValues.filterBy,
      dates: formValues.dates
    });

    // Actualizar paramsSearch con los valores actuales
    this.formParamsByForm();

    // Debug de los parámetros enviados
    console.log('Parámetros de búsqueda:', this.paramsSearch());

    this.kardexRequest?.unsubscribe();
    this.loading.set(true);

const request$ = this.activeView() === this.ALL_HISTORY
      ? this.kardexService.getDailyKardex(page, limit, this.paramsSearch(), type, query, this.fieldSort(), this.order())
      : this.kardexService.getAllAndSearchKardexFisico(
        page,
        limit,
        this.paramsSearch(),
        type,
        query,
        this.fieldSort(),
        this.order(),
      );

    this.kardexRequest = request$.subscribe({
        next: (resp) => {
          const startNum = ((page - 1) * Number(limit)) + 1;
          resp.kardexes.data.forEach((item: any, idx: number) => {
            item.index = startNum + idx;
          });

          this.kardexes.set(resp.kardexes);

          // Update column footers with grand totals
          const totals = this.activeView() === this.PHYSICAL_SUMMARY ? resp.kardexes.totals : undefined;
          if (totals) {
            this.cols.update(cols => cols.map(col => {
              if (col.field === 'product.cod') {
                return { ...col, footer: 'TOTALES' };
              }
              if (col.field === 'quantity_input') {
                return { ...col, footer: this.pipeNumber.transform(totals.quantity_input, this.decimal()) || '0.0000' };
              }
              if (col.field === 'quantity_output') {
                return { ...col, footer: this.pipeNumber.transform(totals.quantity_output, this.decimal()) || '0.0000' };
              }
              if (col.field === 'quantity_saldo') {
                return { ...col, footer: this.pipeNumber.transform(totals.quantity_saldo, this.decimal()) || '0.0000' };
              }
              return { ...col, footer: '' };
            }));
          }

          console.log('Kardex cargado:', resp.kardexes.data?.length, 'registros');
        },
        complete: () => this.loading.set(false),
        error: (err) => {
          console.error('Error cargando kardex:', err);
          this.loading.set(false);
        },
      });
  }

  private applyCurrentDayToAllHistory(): void {
    if (this.isAllProductsRoute() && this.activeView() === this.ALL_HISTORY) {
      this.formReport.patchValue({ filterBy: 'DAY', dates: new Date() });
    }
  }

  // === ACTUALIZAR formParamsByForm PARA ASEGURAR QUE id_product SE INCLUYA ===

  formParamsByForm(): void {
    this.paramsSearch.update((params) => {
      const {
        filterBy,
        id_sucursal,
        id_provider,
        id_product,
        id_storage,
        dates,
        category_types,
        showZeroSaldo
      } = this.formReport.value;

      const formatDate1 =
        filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY';
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';

      const newParams = {
        type_kardex: params.type_kardex,
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_storage: id_storage ? id_storage : '',
        id_provider: id_provider ? id_provider : '',
        id_product: id_product ? id_product : '',
        category_types: category_types ? category_types : '',
        filterBy: filterBy,
        showZeroSaldo: showZeroSaldo ?? false,
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
        category_ids:
          this.selectedCategoryIds().length > 0
            ? this.selectedCategoryIds().join(',')
            : '',
      };

      console.log('Parámetros formados:', newParams); // Debug
      return newParams;
    });
  }


  // === CORREGIR clearInputs ===

  clearInputs(): void {
    this.formReport.patchValue({
      filterBy: 'RANGE',
      dates: [new Date('2025-01-01'), new Date()],
      id_sucursal: this.validatorsService.id_sucursal(),
      id_provider: '',
      type_kardex: '',
      id_storage: this.validatorsService.id_storage() || '',
      id_product: '', // Asegurar que se limpia
      showZeroSaldo: false,
      category_types: ''
    });

    this.clearSelectProduct();

    // Forzar recarga sin filtros
    setTimeout(() => {
      this.getAllAndSearchKardex(1, this.rows());
    }, 100);
  }

  // Evento cuando se selecciona un producto
  onProductSelect(productId: number | null): void {
    if (productId) {
      const selected = this.dropdownProducts().find(p => p.id === productId);
      if (selected) {
        this.productSelect.set(selected);
      }
      this.formReport.patchValue({
        id_product: productId
      });
    } else {
      this.clearSelectProduct();
    }
  }


  getAllProviders(): void {
    this.providersService.getAllAndSearch(1, 10000, true).subscribe({
      next: (resp) => {
        this.providers.set([]);
        resp.providers.data.forEach((provider) => {
          this.providers.update((providers) => [
            ...providers,
            {
              name: `${provider.full_names} - ${provider.number_document ?? ''}`,
              code: provider.id.toString(),
            },
          ]);
        });
      },
      error: (err) => this.providers.set([]),
    });
  }

  onChangeTypesFilter(): void {
    const type_filter = this.formReport.get('filterBy')?.value;
    if (type_filter == 'RANGE') {
      this.formReport.get('dates')?.setValue([new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  paginate($rows: any): void {
    const { rows, page } = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchKardex(
      this.page(),
      this.rows(),
      this.type(),
      this.query(),
    );
  }

  customSort($sort: any): void {
    let { field, order } = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  historyPageChange(event: any): void {
    const rows = Number(event.rows || this.rows());
    const page = Math.floor(Number(event.first || 0) / rows) + 1;
    this.paginate({ rows, page });
  }

  historySort(event: any): void {
    const field = event.field || 'date';
    const order = Number(event.order) === 1 ? 'ASC' : 'DESC';
    this.customSort({ field, order });
    this.getAllAndSearchKardex(1, this.rows(), this.type(), this.query());
  }

  asValuedMovement(row: any): ValuedKardexMovement {
    return row as ValuedKardexMovement;
  }

  hasQuantity(value: string | number | null | undefined): boolean {
    return Math.abs(Number(value || 0)) > 0.0000001;
  }

  valuedAmount(row: ValuedKardexMovement, value: number | null | undefined): string {
    if (row.valuation?.status !== 'VALUED' || value === null || value === undefined) return 'SIN VALORAR';
    return this.pipeNumber.transform(value, '1.2-2') || '0,00';
  }

  movementIcon(row: ValuedKardexMovement): string {
    if (row.is_reversal) return 'fa-solid fa-rotate-left';
    return row.type === 'INPUT' ? 'fa-solid fa-arrow-left' : 'fa-solid fa-arrow-right';
  }

  movementClass(row: ValuedKardexMovement): string {
    if (row.is_reversal) return 'kardex-event--adjustment';
    return row.type === 'INPUT' ? 'kardex-event--input' : 'kardex-event--output';
  }

  responsibleInitial(row: ValuedKardexMovement): string {
    return row.responsible?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  }

  search($query: any): void {
    const { type, query } = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchKardex(1, this.rows(), this.type(), this.query());
  }

  printPdfReport(): void {
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          const report$ = this.activeView() === this.ALL_HISTORY
            ? this.kardexService.getReportPdf(this.paramsSearch(), this.fieldSort(), this.order())
            : this.kardexService.getReportPdfFisico(
              this.paramsSearch(),
              this.type(),
              this.query(),
              this.fieldSort(),
              this.order(),
            );
          report$.subscribe({
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

  printExcelReport(): void {
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid) return;
    this.formParamsByForm();
    Swal.fire({
      title: 'Generando Reporte!',
      html: `Con los parámetros seleccionados`,
      didOpen: () => {
        Swal.showLoading();
        new Promise((resolve, reject) => {
          const report$ = this.activeView() === this.ALL_HISTORY
            ? this.kardexService.getReportExcel(this.paramsSearch(), this.fieldSort(), this.order())
            : this.kardexService.getReportExcelFisico(
              this.paramsSearch(),
              this.type(),
              this.query(),
              this.fieldSort(),
              this.order(),
            );
          report$.subscribe({
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
}
