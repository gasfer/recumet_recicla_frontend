import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Scale, Scales } from '../interfaces/scale.interface';
import { ScalesService } from '../services/scales.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-scales',
  templateUrl: './scales.component.html',
  styles: [
  ]
})
export class ScalesComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchScales(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchScales(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'id', header: 'COD' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: `name`, header: 'NOMBRE' , style:'min-width:150px;', tooltip: true  },
    { field: `cellphone`, header: 'CELULAR' , style:'min-width:90px;max-width:100px;', tooltip: true  },
    { field: `address`, header: 'DIRECCIÓN' , style:'min-width:150px;', tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRE', code: 'name'},
    {name: 'COD', code: 'id'},   
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  scales  = signal<Scales|undefined>(undefined);
  private scalesService = inject(ScalesService);
  validatorsService     = inject(ValidatorsService);
  save$!: Subscription;
  fieldSort = signal('');
  order     = signal('');

  ngOnInit(): void {
    this.getAllAndSearchScales(1,this.rows(),true);
    this.save$ = this.scalesService.save$.subscribe(resp => this.getAllAndSearchScales(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchScales(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.scalesService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.scales.set(resp.scales);
        this.scales()!.data.forEach((scale) => {
          scale.options = scale.status  ? [
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('BALANZAS','update'),
              class:'p-button-rounded p-button-warning p-button-sm',
              eventClick: () => {
                this.editShowModal(scale);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('BALANZAS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(scale,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('BALANZAS','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(scale,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(scale: Scale,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Balanza?`,
      text: `Esta apunto de ${statusText} a ${scale.name}`,
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
          this.scalesService.putInactiveOrActive(scale.id!,newStatus).subscribe({
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
        this.getAllAndSearchScales(1,this.rows(),!newStatus);
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
    this.getAllAndSearchScales(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchScales(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.scalesService.isEdit = false;
    this.scalesService.showModal = true;
  }

  editShowModal(scale:Scale) {
    this.scalesService.isEdit = true;
    this.scalesService.editSubs.emit(scale);
    this.scalesService.showModal = true;
  }
}
