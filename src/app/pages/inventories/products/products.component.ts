import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product, Products } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  validatorsService = inject(ValidatorsService);
  productsService   = inject(ProductsService);
  router            = inject(Router);

  pipeNumber    = new DecimalPipe('en-US');
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  // ── Filtros ─────────────────────────────────────────────────────────
  selectedCategories:  string[] = [];
  selectedSearchField: string   = 'name';
  searchQuery:         string   = '';
  categoryOptions = signal<{ name: string; code: string }[]>([]);

  // ── Suscripciones ────────────────────────────────────────────────────
  private searchSubject = new Subject<string>();
  private searchSub!:   Subscription;
  private productsSub?: Subscription;
  private excelSub?:    Subscription;
  private pdfSub?:      Subscription;
  save$!:               Subscription;
  // ────────────────────────────────────────────────────────────────────

  activeMenu  = signal<MenuItem | undefined>(undefined);

  searchItems = signal<MenuItem[]>([
    {
      label: 'Activos',
      icon: 'fa-solid fa-circle-check',
      command: () => {
        this.activeMenu.set(this.searchItems()[0]);
        this.resetFilters();
        this.getAllAndSearchProducts(1, this.rows(), true);
      }
    },
    {
      label: 'Inactivos',
      icon: 'fa-solid fa-trash-can',
      command: () => {
        this.activeMenu.set(this.searchItems()[1]);
        this.resetFilters();
        this.getAllAndSearchProducts(1, this.rows(), false);
      }
    }
  ]);

  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'COD', style: 'min-width:90px;max-width:90px;', tooltip: true, isLink: true, link: '/inventories/kardex-existencia?p=${value}', field2: 'id', tooltipMsg: 'Ver kardex' },
    { field: 'img', header: 'IMAGEN', style: 'min-width:100px;max-width:100px;', tooltip: false, isImg: true, typeImg: 'products' },
    { field: 'name', header: 'NOMBRE', style: 'min-width:200px;max-width:200px;', tooltip: true, isText: true },
    { field: 'description', header: 'DESCRIPCION', style: 'min-width:150px;max-width:300px;', tooltip: true, isText: true },
    { field: 'costo', header: 'COSTO', style: 'min-width:100px;max-width:100px;', tooltip: true,
      isTag: true,
      tagValue: (val: string) => this.pipeNumber.transform(val != 'null' ? Number(val) : 0, this.decimal()),
      tagColor: (_: number)   => 'primary',
      tagIcon:  (_: number)   => 'fa-solid fa-sack-dollar'
    },
    { field: 'category.name', header: 'CATEGORÍA', style: 'min-width:150px;max-width:150px;', tooltip: true, isText: true },
    { field: 'unit.siglas', header: 'UNIDAD', style: 'min-width:90px;max-width:90px;', tooltip: true, isText: true },
    { field: 'prices', header: 'PRECIOS', style: 'min-width:80px;max-width:80px;', isArray: true, activeSortable: false,
      colsChild: [{ field: 'name', header: 'NOMBRE' }, { field: 'price', header: 'PRECIO' }, { field: 'profit_margin', header: 'MARGEN %' }]
    },
    { field: 'stocks', header: 'STOCK', style: 'min-width:80px;max-width:80px;', isArray: true, activeSortable: false,
      colsChild: [{ field: 'stock', header: 'STOCK' }, { field: 'sucursal.name', header: 'SUCURSAL' }, { field: 'storage.name', header: 'ALMACÉN' }]
    },
    { field: 'options', header: 'OPCIONES', style: 'min-width:210px;max-width:210px', isButton: true, activeSortable: false }
  ]);

  searchFor = signal<SearchFor[]>([
    { name: 'NOMBRE',      code: 'name' },
    { name: 'COD',         code: 'cod' },
    { name: 'DESCRIPCION', code: 'description' },
    { name: 'COSTO',       code: 'costo' },
    { name: 'CATEGORÍA',   code: 'category.name' },
    { name: 'UNIDAD',      code: 'unit.siglas' },
  ]);

  loading   = signal(false);
  rows      = signal(50);
  page      = signal(1);
  status    = signal(true);
  type      = signal('');
  query     = signal('');
  fieldSort = signal('');
  order     = signal('');
  products  = signal<Products | undefined>(undefined);

  ngOnInit(): void {
    this.getAllAndSearchProducts(1, this.rows(), true);

    this.save$ = this.productsService.save$.subscribe(
      () => this.getAllAndSearchProducts(this.page(), this.rows(), this.status())
    );

    this.loadCategoryOptions();

    this.searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.query.set(query);
      this.type.set(query ? this.selectedSearchField : '');
      this.getAllAndSearchProducts(1, this.rows(), this.status(), this.type(), query);
    });
  }

  ngOnDestroy(): void {
    this.save$.unsubscribe();
    this.searchSub?.unsubscribe();
    this.productsSub?.unsubscribe();
    this.excelSub?.unsubscribe();
    this.pdfSub?.unsubscribe();
  }

  // ── Carga categorías con ID numérico ────────────────────────────────
  private loadCategoryOptions() {
    this.productsService
      .getAllAndSearch(1, 999, true, '', '', false, '', '', '', '')
      .subscribe({
        next: (resp) => {
          const catMap = new Map<number, string>();
          resp.products.data.forEach(p => {
            if (p.category?.id && p.category?.name) {
              catMap.set(p.category.id, p.category.name);
            }
          });
          this.categoryOptions.set(
            Array.from(catMap.entries()).map(([id, name]) => ({
              name,
              code: id.toString() // ✅ ID numérico — evita error de tipo en BD
            }))
          );
        }
      });
  }

  // ── Filtro por categoría ─────────────────────────────────────────────
onCategoryChange(selected: string[]) {
  this.selectedCategories = selected;

  if (!selected || selected.length === 0) {
    this.type.set(this.searchQuery ? this.selectedSearchField : '');
    this.query.set(this.searchQuery);
    this.getAllAndSearchProducts(1, this.rows(), this.status(), this.type(), this.query());
    return;
  }

  // ✅ Pasa todos los ids separados por coma
  this.type.set('id_category');
  this.query.set(selected.join(','));
  this.getAllAndSearchProducts(1, this.rows(), this.status(), 'id_category', selected.join(','));
}

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  private resetFilters() {
    this.selectedCategories  = [];
    this.selectedSearchField = 'name';
    this.searchQuery         = '';
    this.type.set('');
    this.query.set('');
  }

  // ── Listado principal ────────────────────────────────────────────────
  getAllAndSearchProducts(page: number, limit: number, status: boolean, type: string = '', query: string = '') {
    if (!query) this.loading.set(true);
    this.status.set(status);

    this.productsSub?.unsubscribe(); // ✅ evita suscripciones duplicadas
    this.productsSub = this.productsService
      .getAllAndSearch(page, limit, status, type, query, false, '', '', this.fieldSort(), this.order())
      .subscribe({
        next: (resp) => {
          const products = resp.products;
          products.data.forEach(product => {
            product.options = this.buildProductOptions(product);
          });
          this.products.set(products);
        },
        complete: () => this.loading.set(false),
        error:    () => this.loading.set(false)
      });
  }

  // ── Reportes Excel / PDF ─────────────────────────────────────────────
 printExcelReport() {
  const id_category = this.selectedCategories?.join(',') ?? '';
  const id_sucursal = this.validatorsService.id_sucursal().toString(); // ✅ captura actual
  const type        = this.type();
  const query       = this.query();

  Swal.fire({
    title: 'Generando Reporte!',
    html: 'Con los filtros aplicados',
    didOpen: () => {
      Swal.showLoading();
      this.excelSub?.unsubscribe();
      this.excelSub = this.productsService
        .getReportProductCostExcel(id_category, id_sucursal, this.fieldSort(), this.order(), type, query)
        .subscribe({
          next:  (data) => { window.open(window.URL.createObjectURL(data)); Swal.close(); },
          error: ()     => Swal.close()
        });
    },
  });
}

printPdfReport() {
  const id_category = this.selectedCategories?.join(',') ?? '';
  const id_sucursal = this.validatorsService.id_sucursal().toString(); // ✅ captura actual
  const type        = this.type();
  const query       = this.query();

  Swal.fire({
    title: 'Generando Reporte!',
    html: 'Con los filtros aplicados',
    didOpen: () => {
      Swal.showLoading();
      this.pdfSub?.unsubscribe();
      this.pdfSub = this.productsService
        .getReportProductCostPdf(id_category, id_sucursal, this.fieldSort(), this.order(), type, query)
        .subscribe({
          next:  (data) => { window.open(window.URL.createObjectURL(data)); Swal.close(); },
          error: ()     => Swal.close()
        });
    },
  });
}

  // ── Acciones de tabla ────────────────────────────────────────────────
  updateStatus(product: Product, newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Producto?`,
      text: `Esta apunto de ${statusText} a ${product.name}`,
      icon: newStatus ? 'info' : 'warning',
      confirmButtonText: `Si, ${statusText}!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2' },
      preConfirm: () => new Promise((resolve) => {
        this.productsService.putInactiveOrActive(product.id!, newStatus).subscribe({
          complete: () => resolve(true),
          error: () => {
            Swal.showValidationMessage('Ops...! Lamentablemente no se pudo realizar la solicitud');
            resolve(false);
          }
        });
      }),
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;
      this.getAllAndSearchProducts(1, this.rows(), !newStatus);
      Swal.fire({
        title: 'Éxito!',
        text: `Disponible en la sección de ${newStatus ? 'Activos' : 'Inactivos'}`,
        icon: 'success',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'sweetalert2' },
      });
    });
  }

  private buildProductOptions(product: Product) {
    if (!product.status) {
      return [{
        label: '', icon: 'fa-solid fa-circle-check', tooltip: 'Activar',
        disabled: this.validatorsService.withPermission('PRODUCTOS', 'delete'),
        class: 'p-button-rounded p-button-sm ms-1',
        eventClick: () => this.updateStatus(product, true)
      }];
    }
    return [
      { label: '', icon: 'fa-solid fa-truck-arrow-right', tooltip: 'Proveedores', disabled: true,
        class: 'p-button-rounded p-button-secondary p-button-sm ms-1',
        eventClick: () => { this.productsService.showModalProvider = true; this.productsService.viewProviderSubs.emit(product); }
      },
      { label: '', icon: 'fa-solid fa-tags', tooltip: 'Precios',
        class: 'p-button-rounded p-button-success p-button-sm ms-1',
        eventClick: () => { this.productsService.showModalPrices = true; this.productsService.pricesSubs.emit(product); }
      },
      { label: '', icon: 'fa-solid fa-warehouse', tooltip: 'Asignar sucursales', disabled: true,
        class: 'p-button-rounded p-button-info p-button-sm ms-1',
        eventClick: () => { this.productsService.showModalSucursales = true; this.productsService.assignSucursalSubs.emit(product); }
      },
      { label: '', icon: 'fas fa-edit', tooltip: 'Editar',
        disabled: this.validatorsService.withPermission('PRODUCTOS', 'update'),
        class: 'p-button-rounded p-button-warning p-button-sm ms-1',
        eventClick: () => this.editShowModal(product)
      },
      { label: '', icon: 'fa-solid fa-trash-can', tooltip: 'Inactivar',
        disabled: this.validatorsService.withPermission('PRODUCTOS', 'delete'),
        class: 'p-button-rounded p-button-danger p-button-sm ms-1',
        eventClick: () => this.updateStatus(product, false)
      }
    ];
  }

  paginate($rows: any) {
    const { rows, page } = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchProducts(this.page(), this.rows(), this.status(), this.type(), this.query());
  }

  search($query: any) {
    const { type, query } = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchProducts(1, this.rows(), this.status(), this.type(), this.query());
  }

  customSort($sort: any) {
    const { field, order } = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  showModal() {
    this.productsService.isEdit   = false;
    this.productsService.showModal = true;
  }

  editShowModal(product: Product) {
    this.productsService.isEdit   = true;
    this.productsService.editSubs.emit(product);
    this.productsService.showModal = true;
  }

  showListPrices() {
    this.router.navigateByUrl('inventories/list-products-prices');
  }
}
