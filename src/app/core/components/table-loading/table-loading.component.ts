import { Component, Input, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { ColsTable } from '../interfaces/OptionsTable.interface';

@Component({
  selector: 'app-table-loading',
  templateUrl: './table-loading.component.html',
  styles: [`
    :host ::ng-deep #tableloading .p-datatable-header {
      border-top-right-radius: 20px;
      border-top-left-radius: 20px;
    }
  `]
})
export class TableLoadingComponent {
  @Input() cols: ColsTable[] = [
    { header: 'CÓDIGO'  },
    { header: 'NOMBRE'  },
    { header: 'ESTADO'  },
    { header: 'OPCIONES'  }
  ];
  @Input() includeSearch = true;
  @Input() customPagination = false;
  @ViewChild('dt') dt: Table | undefined;
  constructor() { }

  applyFilterGlobal($event:any, stringVal:string) {
    this.dt!.filterGlobal(($event.target as HTMLInputElement).value, stringVal);
  }
}
