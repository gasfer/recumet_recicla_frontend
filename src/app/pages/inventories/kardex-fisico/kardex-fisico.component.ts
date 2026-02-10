import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LazyLoadEvent, MenuItem } from 'primeng/api';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../inputs/services/providers.service';
import { FormSearchKardex, Kardexes } from '../interfaces/kardex.interface';
import { KardexService } from '../services/kardex.service';
import * as moment from 'moment';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import Swal from 'sweetalert2';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kardex-fisico',
  templateUrl: './kardex-fisico.component.html',
  styles: [],
})
export class KardexFisicoComponent implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  providersService = inject(ProvidersService);
  kardexService = inject(KardexService);
  productService = inject(ProductsService);
  activatedRoute = inject(ActivatedRoute);

  providers = signal<{ name: string; code: string }[]>([]);
  loading = signal(false);
  rows = signal(50);
  page = signal(1);
  type = signal('');
  query = signal('');
  kardexes = signal<Kardexes | undefined>(undefined);

  // 🆕 Signals para categorías
  categoryIds = signal<number[]>([]);
  pageTitle = signal<string>('CONSULTA DE KARDEX FÍSICO');

  // Signals para el dropdown de productos
  loadingSearchProduct = signal(false);
  productSelect = signal<Product | undefined>(undefined);
  dropdownProducts = signal<Product[]>([]);
  totalProducts = signal(0);
  dropdownPage = signal(1);
  dropdownLimit = signal(50);
  dropdownFilter = signal('');
  productSelectValue: Product | null = null;

  // 🆕 Subscription para limpiar
  private routeSubscription?: Subscription;

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
    category_ids: [], // 🆕
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

  searchItems = signal<MenuItem[]>([
    {
      label: 'ENTRADAS Y SALIDAS',
      icon: 'fa-solid fa-left-right',
      iconStyle: { color: '#3B71CA' },
      command: () => {
        this.paramsSearch().type_kardex = '';
        this.getAllAndSearchKardex(1, this.rows());
      },
    },
  ]);

  formReport: UntypedFormGroup = this.fb.group({
    filterBy: ['YEAR'],
    dates: [new Date(), [Validators.required]],
    type_kardex: [''],
    id_sucursal: ['', [Validators.required]],
    id_storage: ['', [Validators.required]],
    id_provider: [''],
    id_product: [''],
    showZeroSaldo: [false],
    category_ids: [[]] // 🆕
  });

  pipeNumber = new DecimalPipe('en-US');
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  cols = signal<ColsTable[]>([
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
      field: `product.category.name`, // 🆕 Agregar categoría
      header: 'CATEGORÍA',
      style: 'min-width:120px;max-width:150px;',
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

  fieldSort = signal('product.category.name');
  order = signal('desc');

ngOnInit(): void {
  // 🆕 Obtener categoryIds y título de la ruta
  this.routeSubscription = this.activatedRoute.data.subscribe(data => {
    const categoryIds = data['categoryIds'] || [];
    const title = data['title'] || 'CONSULTA DE KARDEX FÍSICO';

    this.categoryIds.set(categoryIds);
    this.pageTitle.set(title);

    // Actualizar el formulario con las categorías
    this.formReport.patchValue({
      category_ids: categoryIds
    });

    console.log('📋 Categorías activas:', categoryIds);
    console.log('📄 Título de página:', title);

    // 🆕 Cargar productos con el filtro de categorías
    this.loadDropdownProducts(true);

    // 🆕 Forzar recarga después de establecer las categorías
    setTimeout(() => {
      this.getAllAndSearchKardex(1, this.rows());
    }, 100);
  });

  this.getAllProviders();

  this.formReport.patchValue({
    filterBy: 'RANGE',
    dates: [new Date('2025-01-01'), new Date()],
    id_sucursal: this.validatorsService.id_sucursal()
  });

  const storagesList = this.validatorsService.storages();
  if (storagesList.length > 0) {
    this.formReport.patchValue({
      id_storage: storagesList[0].id
    });
  }
}



  ngOnDestroy(): void {
    // 🆕 Limpiar suscripción
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }


// === MÉTODOS PARA DROPDOWN DE PRODUCTOS (CORREGIDO) ===
loadDropdownProducts(reset: boolean = false): void {
  if (reset) {
    this.dropdownPage.set(1);
    this.dropdownProducts.set([]);
  }

  this.loadingSearchProduct.set(true);

  const currentCategories = this.categoryIds();

  console.log('🔍 Filtro de productos:', {
    categories: currentCategories,
    dropdownFilter: this.dropdownFilter(),
    page: this.dropdownPage()
  });

  this.productService.getAllAndSearch(
    this.dropdownPage(),
    this.dropdownLimit(),
    true,                    // status
    'pos',                   // type
    this.dropdownFilter(),   // query
    false,                   // stock
    '',                      // id_sucursal
    '',                      // id_storage
    'id',                    // field_sort
    'DESC',                  // order
    false,                   // withStock
    currentCategories        // 🆕 categoryIds
  ).subscribe({
    next: (resp) => {
      if (reset) {
        this.dropdownProducts.set(resp.products.data);
      } else {
        this.dropdownProducts.update(products => [...products, ...resp.products.data]);
      }
      this.totalProducts.set(resp.products.total);
      this.loadingSearchProduct.set(false);

      console.log('✓ Productos cargados:', {
        cantidad: resp.products.data.length,
        total: resp.products.total,
        conCategorias: currentCategories.length > 0 ? 'SÍ' : 'NO'
      });
    },
    error: (e) => {
      console.error('❌ Error cargando productos:', e);
      this.loadingSearchProduct.set(false);
    }
  });
}


  // Evento de filtro del dropdown
  filterProduct(event: any): void {
    this.dropdownFilter.set(event.filter);
    this.loadDropdownProducts(true);
  }

  // Evento de scroll infinito (carga perezosa)
  onLazyLoad(event: LazyLoadEvent): void {
    if (this.dropdownProducts().length < this.totalProducts() &&
        !this.loadingSearchProduct()) {
      this.dropdownPage.update(page => page + 1);
      this.loadDropdownProducts();
    }
  }

  // Evento cuando se selecciona un producto
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
        name: product.name,
        category: product.category?.name,
        formValue: this.formReport.get('id_product')?.value
      });
    } else {
      this.clearSelectProduct();
    }
  }

  // Limpiar producto seleccionado
  clearSelectProduct(): void {
    console.log('Limpiando producto seleccionado');

    this.productSelect.set(undefined);
    this.productSelectValue = null;
    this.formReport.patchValue({
      id_product: ''
    });

    console.log('✓ Producto limpiado');

    // Limpiar el dropdown y recargar
    this.dropdownFilter.set('');
    this.dropdownPage.set(1);
    this.loadDropdownProducts(true);
  }

  // === MÉTODO PARA BUSCAR KARDEX (MODIFICADO) ===


// === MÉTODO PARA BUSCAR KARDEX (MEJORADO) ===

getAllAndSearchKardex(
  page: number,
  limit: number,
  type: string = '',
  query: string = '',
): void {
  // Asegurar que el id_sucursal está actualizado
  this.formReport.patchValue({
    id_sucursal: this.validatorsService.id_sucursal(),
    category_ids: this.categoryIds() // 🆕 Asegurar categorías
  });

  this.formReport.markAllAsTouched();
  if (!this.formReport.valid) {
    console.error('Formulario inválido');
    return;
  }

  const formValues = this.formReport.value;
  console.log('📝 Formulario valores:', {
    id_product: formValues.id_product,
    id_sucursal: formValues.id_sucursal,
    id_storage: formValues.id_storage,
    category_ids: formValues.category_ids,
    filterBy: formValues.filterBy,
    dates: formValues.dates,
    showZeroSaldo: formValues.showZeroSaldo
  });

  // Actualizar paramsSearch con los valores actuales
  this.formParamsByForm();

  console.log('📤 Parámetros de búsqueda:', this.paramsSearch());

  if (!query) {
    this.loading.set(true);
  }

  this.kardexService
    .getAllAndSearchKardexFisico(
      page,
      limit,
      this.paramsSearch(),
      type,
      query,
      this.fieldSort(),
      this.order(),
    )
    .subscribe({
      next: (resp) => {
        const showZeroSaldo = this.formReport.get('showZeroSaldo')?.value;

        // 🆕 Corregir el filtrado: mostrar solo si showZeroSaldo es true
        const filteredData = {
          ...resp.kardexes,
          data: showZeroSaldo
            ? resp.kardexes.data
            : resp.kardexes.data.filter((item: any) => Number(item.quantity_saldo) > 0),
        };

        this.kardexes.set(filteredData);
        console.log('✓ Kardex cargado:', filteredData.data?.length, 'registros de', resp.kardexes.total);
      },
      complete: () => this.loading.set(false),
      error: (err) => {
        console.error('❌ Error cargando kardex:', err);
        this.loading.set(false);
      },
    });
}



// === ACTUALIZAR formParamsByForm (MEJORADO) ===

formParamsByForm(): void {
  this.paramsSearch.update((params) => {
    const {
      filterBy,
      id_sucursal,
      id_provider,
      id_product,
      id_storage,
      dates,
      category_ids,
      type_kardex,
    } = this.formReport.value;

    const formatDate1 =
      filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY';
    const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';

    const newParams: FormSearchKardex = {
      type_kardex: type_kardex || params.type_kardex,
      id_sucursal: id_sucursal ? id_sucursal : '',
      id_storage: id_storage ? id_storage : '',
      id_provider: id_provider ? id_provider : '',
      id_product: id_product ? id_product : '',
      category_ids: category_ids || [], // 🆕 Mantener array vacío si no hay categorías
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
      include_zero: false, // 🆕 Añadir este campo
    };

    console.log('🔧 Parámetros formados:', newParams);
    return newParams;
  });
}


  // === CORREGIR clearInputs (MODIFICADO) ===

  clearInputs(): void {
    this.formReport.patchValue({
      filterBy: 'RANGE',
      dates: [new Date('2025-01-01'), new Date()],
      id_sucursal: this.validatorsService.id_sucursal(),
      id_provider: '',
      type_kardex: '',
      id_storage: this.validatorsService.storages().length > 0
        ? this.validatorsService.storages()[0].id
        : '',
      id_product: '',
      showZeroSaldo: false,
      category_ids: this.categoryIds() // 🆕 Mantener las categorías
    });

    this.clearSelectProduct();

    // Forzar recarga sin filtros
    setTimeout(() => {
      this.getAllAndSearchKardex(1, this.rows());
    }, 100);
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
          this.kardexService
            .getReportPdfFisico(
              this.paramsSearch(),
              this.fieldSort(),
              this.order(),
            )
            .subscribe({
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
          this.kardexService
            .getReportExcelFisico(
              this.paramsSearch(),
              this.fieldSort(),
              this.order(),
            )
            .subscribe({
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
