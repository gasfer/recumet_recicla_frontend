import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { UsersService } from '../../managements/services/users.service';
import { CajasSmall } from '../interfaces/query-caja.interface';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import * as moment from 'moment';
import { CajaService } from '../services/caja.service';
import { DecimalPipe } from '@angular/common';
import { GetAllTotalesMovements } from '../interfaces/adm-caja.interface';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-query-caja',
  templateUrl: './query-caja.component.html',
  styles: [
    `
    .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
    }
  `
  ]
})
export class QueryCajaComponent implements OnInit{
  fb                    = inject( FormBuilder);
  validatorsService     = inject( ValidatorsService);
  authService           = inject( AuthService );
  cajaService           = inject( CajaService );
  usersService          = inject( UsersService );

  users                 = signal<{name:string, code:string}[]>([]);
  loading               = signal(false);
  rows                  = signal(50);
  page                  = signal(1);
  type                  = signal('');
  query                 = signal('');
  cajasSmall            = signal<CajasSmall|undefined>(undefined);
  paramsSearch          = signal<{}>({
    filterBy:'MONTH',
    date1: '',
    date2: '',
    id_sucursal: null,
    id_user: null
  });
  types_filtrado    = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  totalMovements  = signal<GetAllTotalesMovements|undefined>(undefined);
  pipeNumber      = new DecimalPipe('en-US');
  decimalLength   = signal(this.validatorsService.decimalLength());
  decimal         = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  formReport:UntypedFormGroup = this.fb.group({
    filterBy: ['MONTH'],
    dates: [new Date(), [Validators.required]],
    id_user:[],
    id_sucursal: [this.validatorsService.id_sucursal()]
  });
  cols = signal<ColsTable[]>([
    { field: 'date_apertura', header: 'FECHA APERTURA' , style:'min-width:100px;max-width:100px;', tooltip: true, isDate: true},
    { field: 'date_cierre',   header: 'FECHA CIERRE' , style:'min-width:100px;max-width:100px;', tooltip: true, isDate: true},
    { field: `monto_apertura`, header: 'M. APERTURA' , style:'min-width:100px;max-width:100px;text-align: center;', tooltip: true ,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },
    { field: `total_movements.monto_apertura_mas_saldo`,   header: 'APERTURA + SALDO' , style:'min-width:110px;max-width:110px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },
    { field: `monto_cierre`,   header: 'M. CIERRE' , style:'min-width:100px;max-width:100px;text-align: center;', tooltip: true,
      isValueUpdate:true,tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
    },
    { field: 'status', header: 'ESTADO' , style:'min-width:70px;max-width:70px;', tooltip: false, isTag: true,
      tagValue: (val:string)=>  val == 'ABIERTO' ? 'ABIERTO': 'CERRADO',
      tagColor: (val:string)=>  val == 'ABIERTO' ? 'success': 'danger',
      tagIcon: (val:string)=>   val == 'ABIERTO' ? 'fa-solid fa-cash-register' : 'fa-solid fa-shop-lock'
    },
    { field: 'sucursal.name',   header: 'SUCURSAL' , style:'min-width:120px;max-width:120px;', tooltip: true},
    { field: 'user.full_names',   header: 'USUARIO' , style:'min-width:120px;max-width:120px;', tooltip: true,isText:true},
    { field: 'options', header: 'OPCIONES', style:'min-width:80px;max-width:80px;', isButton:true, activeSortable:false }
  ]);
  fieldSort = signal('');
  order     = signal('');


  ngOnInit(): void {
    this.getAllAndSearchCajasSmall(1,this.rows());
    if(this.authService.getUser.role == 'ADMINISTRADOR') {
      this.getAllUsers();
    }
  }

  getAllAndSearchCajasSmall(page: number, limit: number,type: string = '', query: string = '') {
    if(this.authService.getUser.role != 'ADMINISTRADOR') {
      this.formReport.patchValue({
        id_user: this.authService.getUser.id
      });
    }
    this.formReport.markAllAsTouched();
    if(!this.formReport.valid) return;
    this.formParamsByForm();
    if(!query) {this.loading.set(true);} //not loading in search
    this.cajaService.getAllAndSearchConsultasCaja(page,limit,this.paramsSearch(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.cajasSmall.set(resp.cajas_small);
        this.cajasSmall()!.data.forEach((caja_small) => {
          caja_small.options = caja_small.status == 'ABIERTO' ? [
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Imprimir detalle',
              class:'p-button-rounded p-button-sm',
              eventClick: () => {
                this.cajaService.printPdfArqueoCaja(caja_small.id);
              }
            },
            {
              label:'',icon:'fa-solid fa-shop-lock', 
              tooltip: 'Cerrar caja',
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.cajaService.showModalOpenCaja = true;
                this.cajaService.type_event = 'CLOSE_CAJA';
                this.totalMovements.set(caja_small.total_movements);
              }
            },
          ] : [
            { 
              label:'',icon:'fas fa-print', 
              tooltip: 'Imprimir detalle',
              class:'p-button-rounded p-button-sm',
              eventClick: () => {
                this.cajaService.printPdfArqueoCaja(caja_small.id);
              }
            },  
          ];
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  
  formParamsByForm() {
    this.paramsSearch.update((params)=> {
      const { filterBy, id_sucursal, id_user, dates} = this.formReport.value;      
      const formatDate1 = filterBy == 'MONTH' ? 'MM' : filterBy == 'YEAR' ? 'YYYY' : 'DD-MM-YYYY'; 
      const formatDate2 = filterBy == 'MONTH' ? 'YYYY' : 'DD-MM-YYYY';
      return {
        id_sucursal: id_sucursal ? id_sucursal : '',
        id_user: id_user ? id_user : '',
        filterBy: filterBy,
        date1: filterBy == 'RANGE' ?  moment(dates[0]).format(formatDate1) : moment(dates).format(formatDate1),
        date2: filterBy == 'RANGE' ?  dates[1] ? moment(dates[1]).format(formatDate1) : '' : moment(dates).format(formatDate2),
      }
    });
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchCajasSmall(this.page(),this.rows(),this.type(),this.query())
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  onChangeTypesFilter() {
    const type_filter = this.formReport.get('filterBy')?.value;
    if(type_filter == 'RANGE'){
      this.formReport.get('dates')?.setValue([new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  getAllUsers() {
    this.usersService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp)=> {
        this.users.set([]);
        resp.users.data.forEach(user => {
          this.users.update(users => {
            return [...users, {
              name: `${user.full_names} - ${user.number_document ?? ''}`,
              code: user.id.toString(),
            }]
          });
        });
      },
      error: (err)=> this.users.set([])
    });
  }

 
  clearInputs() {
    this.formReport.patchValue({
      filterBy: 'MONTH',
      dates: new Date(),
      id_user: '',
    });
  }
}
