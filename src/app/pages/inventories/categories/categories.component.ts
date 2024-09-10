import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Categories, Category } from '../interfaces/categories.interface';
import { CategoriesService } from '../services/categories.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styles: [
  ]
})
export class CategoriesComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchCategories(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchCategories(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'id', header: 'COD' , style:'min-width:100px;max-width:100px;', tooltip: true},
    { field: `name`, header: 'NOMBRE' , style:'min-width:300px;max-width:500px;', tooltip: true  },
    { field: `description`, header: 'DESCRIPCION' , style:'min-width:300px;',tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true,
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'COD', code: 'id'},   
    {name: 'NOMBRE', code: 'name'},
    {name: 'DESCRIPCION', code: 'description'},
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  categories   = signal<Categories|undefined>(undefined);
  private categoriesService = inject(CategoriesService);
  validatorsService = inject(ValidatorsService);
  save$!: Subscription;
  fieldSort = signal('');
  order     = signal('');

  ngOnInit(): void {
    this.getAllAndSearchCategories(1,this.rows(),true);
    this.save$ = this.categoriesService.save$.subscribe(resp => this.getAllAndSearchCategories(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchCategories(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
     if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.categoriesService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.categories.set(resp.categories);
        this.categories()!.data.forEach((category) => {
          category.options = category.status  ? [
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('CATEGORIAS','update'),
              class:'p-button-rounded p-button-warning p-button-sm',
              eventClick: () => {
                this.editShowModal(category);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('CATEGORIAS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(category,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('CATEGORIAS','delete'),
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




  updateStatus(category: Category,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Categoría?`,
      text: `Esta apunto de ${statusText} a ${category.name}`,
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
          this.categoriesService.putInactiveOrActive(category.id!,newStatus).subscribe({
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
        this.getAllAndSearchCategories(1,this.rows(),!newStatus);
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
    this.getAllAndSearchCategories(this.page(),this.rows(),this.status(),this.type(),this.query())
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchCategories(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.categoriesService.isEdit = false;
    this.categoriesService.showModal = true;
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  editShowModal(category:Category) {
    this.categoriesService.isEdit = true;
    this.categoriesService.editSubs.emit(category);
    this.categoriesService.showModal = true;
  }
}
