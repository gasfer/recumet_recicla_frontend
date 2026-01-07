import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../inputs/services/providers.service';
import { FormSearchKardex, Kardexes } from '../interfaces/kardex.interface';
import { KardexService } from '../services/kardex.service';
import * as moment from 'moment';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-kardex',
  templateUrl: './kardex.component.html',
  styles: [`
    .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class KardexComponent implements OnInit {

  // =====================
  // INYECCIÓN DE SERVICIOS
  // =====================
  fb = inject(FormBuilder);
  validatorsService = inject(ValidatorsService);
  providersService = inject(ProvidersService);
  kardexService = inject(KardexService);
  productService = inject(ProductsService);

  // =========
  // SIGNALS
  // =========
  providers = signal<{ name: string; code: string }[]>([]);
  loading = signal(false);
  rows = signal(50);
  page = signal(1);
  type = signal('');
  query = signal('');
  kardexes = signal<Kardexes | undefined>(undefined);

  loadingSearchProduct = signal(false);
  txtSearchProduct = signal('');
  suggestedProducts = signal<Product[]>([]);
  productSelect = signal<Product | undefined>(undefined);

  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  paramsSearch = signal<FormSearchKardex>({
    filterBy: 'YEAR',
    date1: '',
    date2: '',
    id_product: '',
    id_provider: '',
    id_storage: '',
    id_sucursal: '',
    type_kardex: ''
  });

  // =========================
  // FORMATO NUMÉRICO (ÚNICO)
  // =========================
  formatNumeric(value: any): string {
    const num = Number(value);
    if (value === null || value === undefined || isNaN(num)) return '0,00';

    return num.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // =====================
  // TIPOS DE FILTRO
  // =====================
  types_filtrado = signal([
    { name: 'DIA', code: 'DAY' },
    { name: 'MES', code: 'MONTH' },
    { name: 'AÑO', code: 'YEAR' },
    { name: 'RANGO', code: 'RANGE' },
  ]);

  // =====================
  // BOTONES
  // =====================
  buttonItems: MenuItem[] = [
    {
      label: 'Excel',
      icon: 'fa-regular fa-file-excel',
      iconStyle: { color: '#14A44D' },
      command: () => this.printExcelReport()
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
      }
    },
    {
      label: 'ENTRADAS',
      icon: 'fa-solid fa-arrow-left',
      iconStyle: { color: '#14A44D' },
      command: () => {
        this.paramsSearch().type_kardex = 'INPUT';
        this.getAllAndSearchKardex(1, this.rows());
      }
    },
    {
      label: 'SALIDAS',
      icon: 'fa-solid fa-arrow-right',
      iconStyle: { color: '#DC4C64' },
      command: () => {
        this.paramsSearch().type_kardex = 'OUTPUT';
        this.getAllAndSearchKardex(1, this.rows());
      }
    },
  ]);

  // =====================
  // FORMULARIO
  // =====================
  formReport: UntypedFormGroup = this.fb.group({
    filterBy: ['YEAR'],
    dates: [new Date(), [Validators.required]],
    type_kardex: [''],
    id_sucursal: ['', [Validators.required]],
    id_storage: ['', [Validators.required]],
    id_provider: [''],
    id_product: ['']
  });

  // =====================
  // COLUMNAS DE LA TABLA
  // =====================
  cols = signal<ColsTable[]>([
    {
      field: 'type',
      header: 'TIPO',
      style: 'min-width:90px;max-width:90px;text-align:center;',
      tooltip: false,
      isTag: true,
      tagValue: (val: string) => val === 'INPUT' ? 'ENTRADA' : 'SALIDA',
      tagColor: (val: string) => val === 'INPUT' ? 'success' : 'danger',
      tagIcon: (val: string) =>
        val === 'INPUT'
          ? 'fa-solid fa-arrow-left'
          : 'fa-solid fa-arrow-right'
    },
    {
      field: 'date',
      header: 'FECHA',
      style: 'min-width:100px;max-width:100px;',
      tooltip: true,
      isDate: true
    },
    {
      field: 'detalle',
      header: 'DETALLE',
      style: 'min-width:180px;max-width:180px;',
      tooltip: true,
      isText: true
    },
    {
      field: 'product.name',
      header: 'PRODUCTO',
      style: 'min-width:180px;max-width:180px;',
      tooltip: true,
      isText: true
    },
    {
      field: 'product.unit.name',
      header: 'UND',
      style: 'min-width:80px;max-width:80px;text-align:center;',
      tooltip: true,
      isText: true
    },
    {
      field: 'quantity_input',
      header: 'CANT ENTRADA',
      style: 'min-width:110px;max-width:120px;text-align:right;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.formatNumeric(val)
    },
    {
      field: 'quantity_output',
      header: 'CANT SALIDA',
      style: 'min-width:110px;max-width:120px;text-align:right;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.formatNumeric(val)
    },
    {
      field: 'quantity_saldo',
      header: 'CANT SALDO',
      style: 'min-width:110px;max-width:120px;text-align:right;',
      tooltip: true,
      isValueUpdate: true,
      tagValue: (val: number) => this.formatNumeric(val)
    }
  ]);

  fieldSort = signal('date');
  order = signal<'ASC' | 'DESC'>('DESC');

  // =====================
  // CICLO DE VIDA
  // =====================
  ngOnInit(): void {
    this.getAllProviders();

    const storagesList = this.validatorsService.storages();
    if (storagesList.length > 0) {
      this.formReport.patchValue({ id_storage: storagesList[0].id });
    }

    this.getAllAndSearchKardex(1, this.rows());
  }

  // =====================
  // FUNCIONES PRINCIPALES
  // =====================
  getAllAndSearchKardex(page: number, limit: number, type: string = '', query: string = '') {
    this.formReport.patchValue({ id_sucursal: this.validatorsService.id_sucursal() });
    this.formReport.markAllAsTouched();
    if (!this.formReport.valid) return;

    this.formParamsByForm();
    if (!query) this.loading.set(true);

    this.kardexService
      .getAllAndSearchKardex(page, limit, this.paramsSearch(), type, query, this.fieldSort(), this.order())
      .subscribe({
        next: (resp) => this.kardexes.set(resp.kardexes),
        complete: () => this.loading.set(false),
        error: () => this.loading.set(false)
      });
  }

  suggestedProduct(txt: string) {
    if (!txt) {
      this.suggestedProducts.set([]);
      return;
    }

    this.loadingSearchProduct.set(true);
    this.productService.getAllAndSearch(1, 1000, true, 'pos', txt).subscribe({
      next: resp => {
        this.suggestedProducts.set(resp.products.data);
        this.loadingSearchProduct.set(false);
      },
      error: () => this.loadingSearchProduct.set(false)
    });
  }

  selectProduct(product: Product) {
    this.suggestedProducts.set([]);
    this.productSelect.set(product);
    this.formReport.get('id_product')?.setValue(product.id);
  }

  clearSelectProduct() {
    this.productSelect.set(undefined);
    this.formReport.get('id_product')?.setValue(null);
  }

  formParamsByForm() {
    this.paramsSearch.update(params => {
      const { filterBy, id_sucursal, id_provider, id_product, id_storage, dates } = this.formReport.value;
      const formatDate1 = filterBy === 'MONTH' ? 'MM' : filterBy === 'YEAR' ? 'YYYY' : 'DD-MM-YYYY';
      const formatDate2 = filterBy === 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';

      return {
        ...params,
        filterBy,
        id_sucursal: id_sucursal ?? '',
        id_storage: id_storage ?? '',
        id_provider: id_provider ?? '',
        id_product: id_product ?? '',
        date1: filterBy === 'RANGE'
          ? moment(dates[0]).format(formatDate1)
          : moment(dates).format(formatDate1),
        date2: filterBy === 'RANGE'
          ? dates[1] ? moment(dates[1]).format(formatDate1) : ''
          : moment(dates).format(formatDate2)
      };
    });
  }

  paginate(e: any) {
    this.rows.set(e.rows);
    this.page.set(e.page);
    this.getAllAndSearchKardex(this.page(), this.rows(), this.type(), this.query());
  }

  customSort(e: any) {
    this.fieldSort.set(e.field);
    this.order.set(e.order);
  }

  search(e: any) {
    this.type.set(e.type);
    this.query.set(e.query);
    this.getAllAndSearchKardex(1, this.rows(), this.type(), this.query());
  }

  onChangeTypesFilter() {
    const type = this.formReport.get('filterBy')?.value;
    this.formReport.get('dates')?.setValue(type === 'RANGE' ? [new Date()] : new Date());
  }

  getAllProviders() {
    this.providersService.getAllAndSearch(1, 10000, true).subscribe({
      next: resp => {
        this.providers.set(
          resp.providers.data.map(p => ({
            name: `${p.full_names} - ${p.number_document ?? ''}`,
            code: p.id.toString()
          }))
        );
      },
      error: () => this.providers.set([])
    });
  }

  // =====================
  // REPORTES
  // =====================
  printPdfReport() {
    if (!this.formReport.valid) return;
    this.formParamsByForm();

    Swal.fire({
      title: 'Generando Reporte',
      didOpen: () => {
        Swal.showLoading();
        this.kardexService.getReportPdf(this.paramsSearch(), this.fieldSort(), this.order()).subscribe({
          next: data => {
            const fileURL = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
            window.open(fileURL);
            Swal.close();
          },
          error: () => Swal.close()
        });
      }
    });
  }

  printExcelReport() {
    if (!this.formReport.valid) return;
    this.formParamsByForm();

    Swal.fire({
      title: 'Generando Reporte',
      didOpen: () => {
        Swal.showLoading();
        this.kardexService.getReportExcel(this.paramsSearch(), this.fieldSort(), this.order()).subscribe({
          next: data => {
            const fileURL = URL.createObjectURL(
              new Blob([data], { type: 'application/vnd.ms-excel' })
            );
            window.open(fileURL);
            Swal.close();
          },
          error: () => Swal.close()
        });
      }
    });
  }

  clearInputs() {
    this.formReport.reset({
      filterBy: 'YEAR',
      dates: new Date(),
      id_sucursal: '',
      id_provider: '',
      type_kardex: '',
      id_storage: '',
      id_product: ''
    });
  }
}
