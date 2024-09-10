import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Client, Clients } from '../interfaces/client.interface';
import { Subscription } from 'rxjs';
import { ClientsService } from '../services/clients.service';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styles: [
  ]
})
export class ClientsComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchClients(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchClients(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'COD' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: 'full_names', header: 'NOMBRE COMPLETO' , style:'min-width:150px;max-width:300px;', tooltip: true},
    { field: `number_document`, header: 'DOCUMENTO' , style:'min-width:120px;max-width:150px;', tooltip: true  },
    { field: `cellphone`, header: 'CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  },
    { field: `business_name`, header: 'NEGOCIO' , style:'min-width:150px;max-width:200px;', tooltip: true  },
    { field: `type`, header: 'TIPO' , style:'min-width:150px;max-width:150px;',tooltip: true  },
    { field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'DOCUMENTO', code: 'number_document'},
    {name: 'NOMBRES', code: 'full_names'},
    {name: 'CELULAR', code: 'cellphone'},
    {name: 'COD', code: 'cod'},
    {name: 'NEGOCIO', code: 'business_name'},
  ]);
  loading   = signal(false);
  rows      = signal(50);
  page      = signal(1);
  status    = signal(true);
  type      = signal('');
  query     = signal('');
  fieldSort    = signal('');
  order        = signal('');
  clients = signal<Clients|undefined>(undefined);
  private clientsService  = inject(ClientsService);
  validatorsService       = inject(ValidatorsService);
  router       = inject(Router);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchClients(1,this.rows(),true);
    this.save$ = this.clientsService.save$.subscribe(resp => this.getAllAndSearchClients(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchClients(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.clientsService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.clients.set(resp.clients);
        this.clients()!.data.forEach((client) => {
          client.options = client.status  ? [
            { 
              label:'',icon:'fa-solid fa-comment-dollar', 
              tooltip: 'Cuentas por cobrar',
              disabled: this.validatorsService.withPermission('CUENTAS POR COBRAR','view'),
              class:'p-button-rounded  p-button-sm',
              eventClick: () => {
                this.router.navigateByUrl(`/accounts/accounts-receivable?c=${client.id}`)
              }
            },
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('CLIENTES','update'),
              class:'p-button-rounded p-button-warning p-button-sm  ms-1',
              eventClick: () => {
                this.editShowModal(client);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('CLIENTES','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(client,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('CLIENTES','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(client,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(client: Client,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Cliente?`,
      text: `Esta apunto de ${statusText} a ${client.full_names}`,
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
          this.clientsService.putInactiveOrActive(client.id!,newStatus).subscribe({
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
        this.getAllAndSearchClients(1,this.rows(),!newStatus);
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
    this.getAllAndSearchClients(this.page(),this.rows(),this.status(),this.type(),this.query());
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
    this.getAllAndSearchClients(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.clientsService.isEdit = false;
    this.clientsService.showModal = true;
  }

  editShowModal(provider:Client) {
    this.clientsService.isEdit = true;
    this.clientsService.editSubs.emit(provider);
    this.clientsService.showModal = true;
  }
}
