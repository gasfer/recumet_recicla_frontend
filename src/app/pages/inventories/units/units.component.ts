import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Unit, Units } from '../interfaces/units.interface';
import { Subscription } from 'rxjs';
import { UnitsService } from '../services/units.service';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-units',
  templateUrl: './units.component.html',
  styles: [
  ]
})
export class UnitsComponent implements OnInit, OnDestroy{
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchUnits(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchUnits(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'id', header: 'COD' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: `name`, header: 'NOMBRE' , style:'min-width:200px;', tooltip: true  },
    { field: `siglas`, header: 'SIGLAS' , style:'min-width:200px;',tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'COD', code: 'id'},   
    {name: 'NOMBRE', code: 'name'},
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
  units   = signal<Units|undefined>(undefined);
  private unitsService = inject(UnitsService);
  validatorsService    = inject(ValidatorsService);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchUnits(1,this.rows(),true);
    this.save$ = this.unitsService.save$.subscribe(resp => this.getAllAndSearchUnits(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchUnits(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.unitsService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.units.set(resp.units);
        this.units()!.data.forEach((category) => {
          category.options = category.status  ? [
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('UND MEDIDA','update'),
              class:'p-button-rounded p-button-warning p-button-sm',
              eventClick: () => {
                this.editShowModal(category);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('UND MEDIDA','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(category,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('UND MEDIDA','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(category,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(unit: Unit,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Unidad?`,
      text: `Esta apunto de ${statusText} a ${unit.name}`,
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
          this.unitsService.putInactiveOrActive(unit.id!,newStatus).subscribe({
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
        this.getAllAndSearchUnits(1,this.rows(),!newStatus);
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
    this.getAllAndSearchUnits(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchUnits(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.unitsService.isEdit = false;
    this.unitsService.showModal = true;
  }

  editShowModal(unit:Unit) {
    this.unitsService.isEdit = true;
    this.unitsService.editSubs.emit(unit);
    this.unitsService.showModal = true;
  }
}
