import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { UsersService } from '../services/users.service';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { User, Users } from '../interfaces/user.interface';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styles: [
  ]
})
export class UsersComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchUsers(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchUsers(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'number_document', header: 'CI' , style:'min-width:120px;max-width:120px;', tooltip: true},
    { field: `full_names`, header: 'NOMBRE COMPLETO' , style:'min-width:300px;', tooltip: true  },
    { field: `cellphone`, header: 'CELULAR' , style:'min-width:150px;max-width:150px;',tooltip: true  },
    { field: `email`, header: 'CORREO' , style:'min-width:220px;max-width:250px;',tooltip: true  },
    { field: `role`, header: 'ROLE' , style:'min-width:200px;',tooltip: true , },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:250px;max-width:250px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'CI', code: 'number_document'},   
    {name: 'NOMBRE C.', code: 'full_names'},
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  users   = signal<Users|undefined>(undefined);
  private userService = inject(UsersService);
  validatorsService   = inject(ValidatorsService);
  save$!: Subscription;
  fieldSort = signal('');
  order     = signal('');

  ngOnInit(): void {
    this.getAllAndSearchUsers(1,this.rows(),true);
    this.save$ = this.userService.save$.subscribe(resp => this.getAllAndSearchUsers(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchUsers(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.userService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.users.set(resp.users);
        this.users()!.data.forEach((user) => {
          user.options = user.status  ? [
            { 
              label:'',icon:'fa-solid fa-key', 
              tooltip: 'Asignar de permisos',
              disabled: user.role != 'ADMINISTRADOR',
              class:'p-button-rounded p-button-success p-button-sm',
              eventClick: () => {
                this.userService.showModalAssignPermissions = true;
                this.userService.assignPermisosSubs.emit(user);
              }
            },
            { 
              label:'',icon:'fa-solid fa-warehouse', 
              tooltip: 'Asignar de sucursales',
              disabled: user.role != 'ADMINISTRADOR',
              class:'p-button-rounded p-button-info p-button-sm ms-1',
              eventClick: () => {
                this.userService.showModalSucursales = true;
                this.userService.assignSucursalSubs.emit(user);
              }
            },
            { 
              label:'',icon:'fa-solid fa-business-time', 
              tooltip: 'Asignar turnos',
              disabled: user.role != 'ADMINISTRADOR',
              class:'p-button-rounded p-button-secondary p-button-sm ms-1',
              eventClick: () => {
                this.userService.showModalAssignShifts = true;
                this.userService.assignHorariosSubs.emit(user);
              }
            },
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('USUARIOS','update'),
              class:'p-button-rounded p-button-warning p-button-sm ms-1',
              eventClick: () => {
                this.editShowModal(user);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('USUARIOS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(user,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('USUARIOS','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(user,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(user: User,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Usuario?`,
      text: `Esta apunto de ${statusText} a ${user.full_names}`,
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
          this.userService.putInactiveOrActive(user.id!,newStatus).subscribe({
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
        this.getAllAndSearchUsers(1,this.rows(),!newStatus);
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
    this.getAllAndSearchUsers(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchUsers(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.userService.isEdit = false;
    this.userService.showModal = true;
  }

  editShowModal(user:User) {
    this.userService.isEdit = true;
    this.userService.editSubs.emit(user);
    this.userService.showModal = true;
  }
}
