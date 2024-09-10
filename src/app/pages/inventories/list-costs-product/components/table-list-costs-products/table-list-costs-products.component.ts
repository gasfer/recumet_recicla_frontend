import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { Subject, debounceTime } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Paginator } from 'primeng/paginator';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-table-list-costs-products',
  templateUrl: './table-list-costs-products.component.html',
  styles: [`
    :host ::ng-deep .p-datatable .p-datatable-thead > tr:nth-child(0) > th {
        position: -webkit-sticky;
        position: sticky;
        top: 0rem;
        z-index: 1;
    }
    :host ::ng-deep #table .p-datatable-header {
      border-top-right-radius: 20px;
      border-top-left-radius: 20px;
    }
    .layout-news-active :host ::ng-deep .p-datatable tr > th {
        top: 0rem;
        z-index: 1;
    }
    /*Habilitar esta opcion solo si  responsiveLayout="stack"*/
    @media (max-width: 992px) {
      .tdwith {
        max-width:none !important;
      }
    }
  `]
})
export class TableListCostsProductsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cols: ColsTable[] = [];
  @Input() searchFor: SearchFor[] = []; 
  @Input() data!: any;
  @Input() loading: boolean = true;
  @Input() isCustomSort: boolean = true;
  @Input() customPagination: boolean = false;
  @Input() includeSearch: boolean = true;
  @Input() sortField: string = 'id';
  @Input() sortOrder: 'ASC' | 'DESC' = 'DESC';
  @Output() rows!: number;
  @Output() rows$: EventEmitter<{rows: number, page: number}> = new EventEmitter;
  @Output() search$: EventEmitter<{type:string, query:string}> = new EventEmitter;
  @Output() customSort$: EventEmitter<{field:string | string[], order:'ASC' | 'DESC'}> = new EventEmitter;
  @Output() saveProduct$: EventEmitter<any> = new EventEmitter;
  from: number = 0;
  to: number = 0;
  total: number = 0;
  heightTable: string = '400px';
  debounced: Subject<string> = new Subject();
  txtTermino: UntypedFormControl = new UntypedFormControl();
  searchSelect: UntypedFormControl = new UntypedFormControl();
  pipe = new DatePipe('en-US');
  first:number = 0;
  page: number = 0;
  stringSearch: string[] = [];
  @ViewChild('paginator') paginator!: Paginator;
  @ViewChild('dt') dt: Table | undefined;
  
  //edit
  private validatorsService = inject(ValidatorsService);
  pipeNumber    = new DecimalPipe('en-US');
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  private clonedProducts: { [s: string]: any } = {};


  ngOnChanges(simpleChange: SimpleChanges): void {
    this.from = this.data?.from ?? 1;
    this.to = this.data?.to ?? 0;
    this.total = this.data?.total ?? 0;
    this.rows = this.data?.per_page ?? 0; 
    this.stringSearch = this.cols.map(resp => resp.field) as [];
  }

  ngOnInit(): void {
    this.searchSelect.setValue(this.searchFor[0]?.code);
    this.debounced.pipe( debounceTime(500))
        .subscribe(valor =>{ 
          if(this.txtTermino.value === valor){
            this.search$.emit({type:this.searchSelect.value, query:valor});
          }
        });
  }

  ngOnDestroy(): void {
    this.debounced.unsubscribe();
  }


  search(): void {
    const txtInput = this.txtTermino.value ?? '';
    if(txtInput.length === 0) {
      this.search$.emit({query:'',type:''});
      return ;
    }
    if(txtInput.length > 0 ) {
      this.debounced.next(txtInput);
    }
  }

  clearSearch() {
    this.txtTermino.setValue('');
    this.search$.emit({query:'',type:''});
  }
  
  paginate(event : any) {
    this.page = event.page+1;
    const rows = event.rows;
    this.rows = rows;
    this.heightTable = rows === 50 ? '400px' : '600px';
    this.rows$.emit({rows,page:this.page});
  }

  customSort(event:TableLazyLoadEvent) {
    const field = event.sortField ?? 'id' ;
    const order = event.sortOrder == 1 ? 'ASC' : 'DESC';
    this.customSort$.emit({field,order});
    this.paginator?.changePage(0);
  }


  //EDIT
  onRowEditInit(product_old: any) {
    const _product = JSON.parse(JSON.stringify(product_old));
    this.clonedProducts[_product.id as string] = { ..._product };
  }

  onRowEditSave(product: any) {
    this.saveProduct$.next(product);
  }

  onRowEditCancel(product: any, index: number) {
    this.data.data[index] = this.clonedProducts[product.id as string];
    delete this.clonedProducts[product.id as string];
  }

}
