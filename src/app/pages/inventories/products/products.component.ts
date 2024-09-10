import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Product, Products } from '../interfaces/products.interface';
import { ProductsService } from '../services/products.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styles: [
  ]
})
export class ProductsComponent implements OnInit, OnDestroy {
  validatorsService     = inject( ValidatorsService);
  productsService       = inject(ProductsService);
  router                = inject(Router);

  pipeNumber        = new DecimalPipe('en-US');
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.type.set('');this.getAllAndSearchProducts(1,this.rows(),true);}},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {this.type.set('');this.getAllAndSearchProducts(1,this.rows(),false)} },
  ]);
  cols = signal<ColsTable[]>([
    { field: 'cod', header: 'COD' , style:'min-width:90px;max-width:90px;', tooltip: true, isLink:true,link:'/inventories/kardex-existencia?p=${value}', field2:'id', tooltipMsg: 'Ver kardex'},
    { field: 'img', header: 'IMAGEN' , style:'min-width:100px;max-width:100px;', tooltip: false, isImg: true, typeImg: 'products'},
    { field: `name`, header: 'NOMBRE' , style:'min-width:200px;max-width:200px;', tooltip: true , isText: true },
    { field: `description`, header: 'DESCRIPCION' , style:'min-width:150px;max-width:300px;',tooltip: true, isText:true  },
    { field: `costo`, header: 'COSTO' , style:'min-width:100px;max-width:100px;',tooltip: true,
      isTag:true,
      tagValue: (val:string)=>  this.pipeNumber.transform( val != 'null' ? Number(val) : Number(0),this.decimal()),
      tagColor: (val:number)=> 'primary',
      tagIcon: (val:number)=>  'fa-solid fa-sack-dollar'
     },
    { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:150px;max-width:150px;',tooltip: true ,isText: true  },
    { field: `unit.siglas`, header: 'UNIDAD' , style:'min-width:90px;max-width:90px;',tooltip: true ,isText: true  },
    { field: `prices`, header: 'PRECIOS' , style:'min-width:80px;max-width:80px;',isArray: true, activeSortable:false, 
      colsChild: [{field: 'name', header: 'NOMBRE'}, {field: 'price', header: 'PRECIO'}, {field: 'profit_margin', header: 'MARGEN %'}]
    },
    { field: `stocks`, header: 'STOCK' , style:'min-width:80px;max-width:80px;',isArray: true, activeSortable:false, 
      colsChild: [{field: 'stock', header: 'STOCK'}, {field: 'sucursal.name', header: 'SUCURSAL'}, {field: 'storage.name', header: 'ALMACÉN'}]
    },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:210px;max-width:210px', isButton:true, activeSortable:false
    }
  ]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRE', code: 'name'},
    {name: 'COD', code: 'cod'},   
    {name: 'DESCRIPCION', code: 'description'},
    {name: 'COSTO', code: 'costo'},
    {name: 'CATEGORÍA', code: 'category.name'},
    {name: 'UNIDAD', code: 'unit.siglas'},
  ]);
  loading = signal(false);
  rows    = signal(50);
  page    = signal(1);
  status  = signal(true);
  type    = signal('');
  query   = signal('');
  fieldSort = signal('');
  order     = signal('');
  products   = signal<Products|undefined>(undefined);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchProducts(1,this.rows(),true);
    this.save$ = this.productsService.save$.subscribe(resp => this.getAllAndSearchProducts(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchProducts(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.productsService.getAllAndSearch(page,limit,status,type,query,false,'','',this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.products.set(resp.products);
        this.products()!.data.forEach((product) => {
          product.options = product.status  ? [
            { 
              label:'',icon:'fa-solid fa-truck-arrow-right', 
              tooltip: 'Proveedores',
              disabled: true,
              class:'p-button-rounded p-button-secondary p-button-sm ms-1',
              eventClick: () => {
                this.productsService.showModalProvider = true;
                this.productsService.viewProviderSubs.emit(product);
              }
            },
            { 
              label:'',icon:'fa-solid fa-tags', 
              tooltip: 'Precios',
              class:'p-button-rounded p-button-success p-button-sm ms-1',
              eventClick: () => {
                this.productsService.showModalPrices = true;
                this.productsService.pricesSubs.emit(product);
              }
            },
            { 
              label:'',icon:'fa-solid fa-warehouse', 
              tooltip: 'Asignar de sucursales',
              disabled: true,
              class:'p-button-rounded p-button-info p-button-sm ms-1',
              eventClick: () => {
                this.productsService.showModalSucursales = true;
                this.productsService.assignSucursalSubs.emit(product);
              }
            },
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('PRODUCTOS','update'),
              class:'p-button-rounded p-button-warning p-button-sm ms-1',
              eventClick: () => {
                this.editShowModal(product);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('PRODUCTOS','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(product,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('PRODUCTOS','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(product,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(product: Product,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Unidad?`,
      text: `Esta apunto de ${statusText} a ${product.name}`,
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
          this.productsService.putInactiveOrActive(product.id!,newStatus).subscribe({
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
        this.getAllAndSearchProducts(1,this.rows(),!newStatus);
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
    this.getAllAndSearchProducts(this.page(),this.rows(),this.status(),this.type(),this.query())
  }

  search($query:any) {
    const {type, query} = $query;
    this.type.set(type);
    this.query.set(query);
    this.getAllAndSearchProducts(1,this.rows(),this.status(),this.type(),this.query());
  }

  customSort($sort:any) {
    let {field, order} = $sort;
    this.fieldSort.set(field);
    this.order.set(order);
  }

  showModal() {
    this.productsService.isEdit = false;
    this.productsService.showModal = true;
  }

  editShowModal(product:Product) {
    this.productsService.isEdit = true;
    this.productsService.editSubs.emit(product);
    this.productsService.showModal = true;
  }

  showListPrices() {
    this.router.navigateByUrl('inventories/list-products-prices');
  }
}
