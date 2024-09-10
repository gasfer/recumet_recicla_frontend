import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { ColsTable, SearchFor } from '../interfaces/OptionsTable.interface';
import { Subject, debounceTime } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Paginator } from 'primeng/paginator';
import { Table, TableLazyLoadEvent } from 'primeng/table';
import { ComponentsService } from '../../services/components.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
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
export class TableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cols: ColsTable[] = [];
  @Input() searchFor: SearchFor[] = []; 
  @Input() searchTxt: string = ''; 
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
  private componentsService = inject(ComponentsService);
  private router = inject(Router);


  ngOnChanges(simpleChange: SimpleChanges): void {
    this.from = this.data?.from ?? 1;
    this.to = this.data?.to ?? 0;
    this.total = this.data?.total ?? 0;
    this.rows = this.data?.per_page ?? 0; 
    this.stringSearch = this.cols.map(resp => resp.field) as [];
    if(this.searchTxt){
      this.txtTermino.setValue(this.searchTxt);
    }
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

  //? REVISAR PARA IMAGENES DINAMIC
  openViewImage(data: any):void {
    this.componentsService.openModalImage(data.cod,data.name,data.img,'products','45vw');
  }

  applyFilterGlobal($event:any, stringVal:string) {
    this.dt!.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }

  search(): void {
    this.searchTxt = '';
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
    this.searchTxt = '';
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

  getRowData(rowData: any ,colField:any){
    let valReturn = colField.field.split('.').reduce( (o:any, x:any) => 
                    (typeof o == "undefined" || o === null) ? o : o[x], rowData); 
    if(colField.isDate){
      valReturn =  colField.isNotDateAndHour ? this.pipe.transform(valReturn, 'dd/MM/yyyy')! : this.pipe.transform(valReturn, 'dd/MM/yyyy, HH:mm')!;
    }
    return valReturn;
  }
  getRowData2(rowData: any ,colField:any){
    let valReturn = colField.field2.split('.').reduce( (o:any, x:any) => 
                    (typeof o == "undefined" || o === null) ? o : o[x], rowData); 
    if(colField.isDate){
      valReturn =  colField.isNotDateAndHour ? this.pipe.transform(valReturn, 'dd/MM/yyyy')! : this.pipe.transform(valReturn, 'dd/MM/yyyy, HH:mm')!;
    }
    return valReturn;
  }

  getReturnDisable(disabled: boolean){
    if(disabled == undefined){
      return false;
    }
    return !disabled;
  }

  customSort(event:TableLazyLoadEvent) {
    const field = event.sortField ?? 'id' ;
    const order = event.sortOrder == 1 ? 'ASC' : 'DESC';
    this.customSort$.emit({field,order});
    this.paginator?.changePage(0);
  }

  returnLink(link:string,value:string) {
    const _link = link.replace('${value}', value);
    this.router.navigateByUrl(_link);
  }
}
