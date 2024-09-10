import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { TransportCompanyService } from '../services/trasport-company.service';
import { TransportCompanies, TransportCompany } from '../interfaces/trasport_company.interfaces';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-trasport-company',
  templateUrl: './trasport-company.component.html',
  styles: [
  ]
})
export class TrasportCompanyComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchTrasportCompanies(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchTrasportCompanies(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'id', header: 'COD' , style:'min-width:80px;max-width:80px;', tooltip: true},
    { field: `name`, header: 'NOMBRE' , style:'min-width:200px;max-width:200px;', tooltip: true  },
    { field: `nit`, header: 'NIT' , style:'min-width:120px;',tooltip: true  },
    { field: `address`, header: 'DIRECCIÓN' , style:'min-width:200px;max-width:350px;',tooltip: true  },
    { field: `cellphone`, header: 'CELULAR' , style:'min-width:120px;',tooltip: true  },
    { field: `chauffeurs`, header: 'CHOFERES' , style:'min-width:90px;max-width:90px;',tooltip: false, activeSortable: false, isArray: true, colsChild: [
        { field: 'full_names', header: 'NOMBRE CHOFER' },
        { field: 'number_document', header: 'N. DOCUMENTO' }
      ],
    },
    { field: `cargo_trucks`, header: 'CAMIONES' , style:'min-width:90px;max-width:90px;',tooltip: false,activeSortable: false,  widthTable: '350px', isArray: true, colsChild: [
        { field: 'placa', header: 'PLACA DEL VEHÍCULO' },
      ],
    },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:150px;max-width:180px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRE', code: 'name'},
    {name: 'COD', code: 'id'},   
    {name: 'SIGLAS', code: 'siglas'},
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  fieldSort = signal('');
  order     = signal('');
  trasportCompanies   = signal<TransportCompanies|undefined>(undefined);
  private trasportCompanyService = inject(TransportCompanyService);
  validatorsService = inject(ValidatorsService);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchTrasportCompanies(1,this.rows(),true);
    this.save$ = this.trasportCompanyService.save$.subscribe(resp => this.getAllAndSearchTrasportCompanies(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchTrasportCompanies(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.trasportCompanyService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.trasportCompanies.set(resp.trasport_company);
        this.trasportCompanies()!.data.forEach((trasportCompany) => {
          trasportCompany.options = trasportCompany.status  ? [
            { 
              label:'',icon:'fa-solid fa-id-card-clip', 
              tooltip: 'Choferes',
              class:'p-button-rounded p-button-info p-button-sm',
              eventClick: () => {
                this.trasportCompanyService.showModalChauffeurs = true;
                this.trasportCompanyService.chauffeursSubs.emit(trasportCompany);
              }
            },
            { 
              label:'',icon:'fa-solid fa-truck', 
              tooltip: 'Camiones',
              class:'p-button-rounded p-button-success p-button-sm ms-1',
              eventClick: () => {
                this.trasportCompanyService.showModalCargoTrucks = true;
                this.trasportCompanyService.cargoTrucksSubs.emit(trasportCompany);
              }
            },
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('COMP. TRASPORTE','update'),
              class:'p-button-rounded p-button-warning p-button-sm ms-1',
              eventClick: () => {
                this.editShowModal(trasportCompany);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('COMP. TRASPORTE','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(trasportCompany,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('COMP. TRASPORTE','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(trasportCompany,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(trasportCompany: TransportCompany,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Compañía de trasporte?`,
      text: `Esta apunto de ${statusText} a ${trasportCompany.name}`,
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
          this.trasportCompanyService.putInactiveOrActive(trasportCompany.id!,newStatus).subscribe({
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
        this.getAllAndSearchTrasportCompanies(1,this.rows(),!newStatus);
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
    this.getAllAndSearchTrasportCompanies(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchTrasportCompanies(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.trasportCompanyService.isEdit = false;
    this.trasportCompanyService.showModal = true;
  }

  editShowModal(trasportCompany:TransportCompany) {
    this.trasportCompanyService.isEdit = true;
    this.trasportCompanyService.editSubs.emit(trasportCompany);
    this.trasportCompanyService.showModal = true;
  }
}
