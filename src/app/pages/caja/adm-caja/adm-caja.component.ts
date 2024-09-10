import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Detail, GetAllTotalesMovements } from '../interfaces/adm-caja.interface';
import { CajaService } from '../services/caja.service';

@Component({
  selector: 'app-adm-caja',
  templateUrl: './adm-caja.component.html',
  styles: [`
    .card {
      margin-bottom: 10px;
      border: none;
      border-radius: 15px;
      box-shadow: 0.1px 0 30px rgba(0, 0, 0, 0.1);
    }
  `
  ]
})
export class AdmCajaComponent implements OnInit {
  loading = signal(false);
  date = signal(new Date());
  searchItems = signal<MenuItem[]>([
    { 
      label: 'Ingresos', icon: 'fa-solid fa-cash-register',
      iconStyle: { 'color': '#66CC33'},
      command: () => {
        this.movementsTable.set({data: this.ingresos()!});
      }
    },
    { 
      label: 'Gastos', icon: 'fa-solid fa-comment-dollar', 
      iconStyle: { 'color': '#CC3333'},
      command: () => {
        this.movementsTable.set({data: this.gastos()!});
      } 
    }
  ]);
  optionsList =signal<MenuItem[]>([
    {
      label: 'Imprimir Caja',
      icon: 'fas fa-print',
      iconStyle: { 'color': '#DC4C64'},
      command: () => { 
        this.cajaService.printPdfArqueoCaja(this.totalMovements()!.id_caja_small);
      }
    },
    {
      label: 'Monto Inicial',
      icon: 'fa-solid fa-pencil',
      iconStyle: { 'color': '#FFD300'},
      command: () => {  
        this.cajaService.showModalOpenCaja = true;
        this.cajaService.type_event = 'UPDATE_CAJA';
      }
    },
    {
      label: 'Cerrar Caja',
      icon: 'fa-solid fa-shop-lock',
      iconStyle: { 'color': '#14A44D'},
      command: () => { 
        this.cajaService.showModalOpenCaja = true;
        this.cajaService.type_event = 'CLOSE_CAJA';  
      }
    },
  ]);
  moveList =signal<MenuItem[]>([
    {
      label: 'Nuevo Gasto',
      icon: 'fa-solid fa-money-bill-1-wave',
      iconStyle: { 'color': '#007bff'},
      command: () => { 
        this.cajaService.showModalMovementCaja = true;
        this.cajaService.type_movement = 'GASTO';  
      }
    },
    {
      label: 'Nuevo Ingreso',
      icon: 'fa-solid fa-reply',
      iconStyle: { 'color': '#28a745'},
      command: () => { 
        this.cajaService.showModalMovementCaja = true;
        this.cajaService.type_movement = 'INGRESO';  
      }
    }
  ]);
  validatorsService = inject(ValidatorsService);
  cajaService = inject(CajaService);
  pipeNumber = new DecimalPipe('en-US');
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  cols = signal<ColsTable[]>([
    { field: 'description', header: 'DESCRIPCION' , style:'min-width:200px;', tooltip: true},
    { field: `monto`, header: 'MONTO' , style:'min-width:180px;max-width:180px;', tooltip: true, isTag: true, 
      tagValue: (val:number)=>  this.pipeNumber.transform(val,this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
    },
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'CÓDIGO', code: 'cod'},
    {name: 'NUMBER DOC.', code: 'registry_number'},
    {name: 'COMENTARIOS', code: 'comments'},
    {name: 'BALANZA', code: 'scale.name'},
    {name: 'USUARIO', code: 'user.full_names'},
  ]);
  rows         = signal(50);
  page         = signal(1);
  type         = signal('');
  query        = signal('');
  totalMovements = signal<GetAllTotalesMovements|undefined>(undefined);
  movementsTable = signal<{data:Detail[]}|undefined>(undefined);
  ingresos     = signal<Detail[]|undefined>(undefined);
  gastos       = signal<Detail[]|undefined>(undefined);
  data: any;
  options: any;

  ngOnInit() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    this.data = {
        labels: ['MONTO INICIAL', 'INGRESOS', 'GASTOS'],
        datasets: [
            {
                data: [0,0,0],
                backgroundColor: ['#3366CC', '#66CC33', '#CC3333'],
                hoverBackgroundColor: ['#3366CC', '#66CC33', '#CC3333']
            }
        ]
    };
    this.options = {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: textColor
                }
            }
        }
    };
    this.getAllTotalesMovements();
  }
  
  getAllTotalesMovements() {
    this.loading.set(true);
    this.totalMovements.set(undefined);
    this.data.datasets[0].data = [0,0,0];
    this.cajaService.getTotalesAndMovements(this.validatorsService.id_sucursal()).subscribe({
      next: (resp) => {
        this.totalMovements.set(resp);
        this.data.datasets[0].data = [ this.totalMovements()?.monto_apertura, this.totalMovements()?.total_ingresos,this.totalMovements()?.total_gastos];
        this.movementsTable.set({data: resp.ingresos});
        this.ingresos.set(resp.ingresos);
        this.gastos.set(resp.gastos);
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  postOpenCaja() {
    this.cajaService.showModalOpenCaja = true;
    this.cajaService.type_event = 'OPEN_CAJA';  
  }
  
}
