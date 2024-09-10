import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Sucursal, Sucursales } from '../interfaces/sucursales.interface';
import { SucursalesService } from '../services/sucursales.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.component.html',
  styles: [
  ]
})
export class SucursalesComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchSucursales(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchSucursales(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'name', header: 'NOMBRE' , style:'min-width:200px;', tooltip: true},
    { field: `email`, header: 'CORREO' , style:'min-width:150px;max-width:180px;', tooltip: true  },
    { field: `cellphone`, header: 'CELULAR' , style:'min-width:100px;max-width:100px;',tooltip: true  },
    { field: `address`, header: 'DIRECCIÓN' , style:'min-width:220px;max-width:250px;',tooltip: true  },
    { field: `city`, header: 'CIUDAD' , style:'min-width:150px;',tooltip: true , },
    { field: `storage`, header: 'ALMACENES' , style:'min-width:100px;max-width:100px;',tooltip: false, isArray: true, activeSortable: false, 
      colsChild: [{ field: 'name', header: 'NOMBRE'}]
    },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRE', code: 'name'},   
    {name: 'DIRECCIÓN', code: 'address'},
    {name: 'CELULAR', code: 'cellphone'},
    {name: 'CIUDAD', code: 'city'},
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  fieldSort = signal('');
  order     = signal('');
  sucursales   = signal<Sucursales|undefined>(undefined);
  private sucursalService = inject(SucursalesService);
  private authService = inject(AuthService);
  validatorsService = inject(ValidatorsService);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchSucursales(1,this.rows(),true);
    this.save$ = this.sucursalService.save$.subscribe(resp => this.getAllAndSearchSucursales(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchSucursales(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.sucursalService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.sucursales.set(resp.sucursales);
        /* Filtramos solo las sucursales que tiene asignado el solicitante */ 
        if(this.authService.getUser.role != 'ADMINISTRADOR'){ //SI ES OTRO ROL != ADMINISTRADOR SE FILTRAN
          const sucursalesTemp = this.sucursales()!.data;
          this.sucursales()!.data = sucursalesTemp.filter((sucursal:Sucursal) =>
              this.authService.getUser.assign_sucursales!.some((resp) => sucursal.id === resp.id_sucursal)
          );
        }
        this.sucursales()!.data.forEach((sucursal) => {
          sucursal.options = sucursal.status  ? [
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('SUCURSALES','update'),
              class:'p-button-rounded p-button-warning p-button-sm',
              eventClick: () => {
                this.editShowModal(sucursal);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('SUCURSALES','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(sucursal,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('SUCURSALES','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(sucursal,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(sucursal: Sucursal,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Sucursal?`,
      text: `Esta apunto de ${statusText} a ${sucursal.name}`,
      icon: `${newStatus ? 'info' : 'warning'}`,
      confirmButtonText: `Si, ${statusText}!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.sucursalService.putInactiveOrActive(sucursal.id!,newStatus).subscribe({
            complete: () => resolve(true),
            error: (err) => {
              Swal.showValidationMessage(`Ops...! Lamentablemente no se puedo realizar la solicitud`);
              resolve(false);
            }
          });
        });
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
      if(!result.isConfirmed) return;
      if(result.value) {
        this.getAllAndSearchSucursales(1,this.rows(),!newStatus);
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Disponible en la sección de ${newStatus ? "Activos" : "Inactivos"}`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchSucursales(this.page(),this.rows(),this.status(),this.type(),this.query())
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchSucursales(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.sucursalService.isEdit = false;
    this.sucursalService.showModal = true;
  }

  editShowModal(sucursal:Sucursal) {
    this.sucursalService.isEdit = true;
    this.sucursalService.editSubs.emit(sucursal);
    this.sucursalService.showModal = true;
  }
}
