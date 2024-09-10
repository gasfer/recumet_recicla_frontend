import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Storage, Storages } from '../interfaces/storages.interface';
import { StoragesService } from '../services/storages.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-storages',
  templateUrl: './storages.component.html',
  styles: [
  ]
})
export class StoragesComponent implements OnInit, OnDestroy{
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchStorages(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchStorages(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'name', header: 'ALMACÉN' , style:'min-width:200px;', tooltip: true},
    { field: `sucursal.name`, header: 'SUCURSAL' , style:'min-width:200px;', tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'ALMACÉN', code: 'name'},   
    {name: 'SUCURSAL', code: 'sucursal.name'},
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  fieldSort = signal('');
  order     = signal('');
  storages   = signal<Storages|undefined>(undefined);
  private storagesService   = inject(StoragesService);
  validatorsService = inject(ValidatorsService);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchStorages(1,this.rows(),true);
    this.save$ = this.storagesService.save$.subscribe(resp => this.getAllAndSearchStorages(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchStorages(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.storagesService.getAllAndSearch(page,limit,status,this.validatorsService.id_sucursal(),type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.storages.set(resp.storages);
        this.storages()!.data.forEach((storage) => {
          storage.options = storage.status  ? [
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('ALMACENES','update'),
              class:'p-button-rounded p-button-warning p-button-sm',
              eventClick: () => {
                this.editShowModal(storage);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('ALMACENES','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(storage,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('ALMACENES','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(storage,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(storage: Storage,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Sucursal?`,
      text: `Esta apunto de ${statusText} a ${storage.name}`,
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
          this.storagesService.putInactiveOrActive(storage.id!,newStatus).subscribe({
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
        this.getAllAndSearchStorages(1,this.rows(),!newStatus);
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
    this.getAllAndSearchStorages(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchStorages(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.storagesService.isEdit = false;
    this.storagesService.showModal = true;
  }

  editShowModal(storage:Storage) {
    this.storagesService.isEdit = true;
    this.storagesService.editSubs.emit(storage);
    this.storagesService.showModal = true;
  }
}
