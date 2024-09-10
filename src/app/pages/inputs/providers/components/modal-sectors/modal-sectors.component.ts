import {  Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { ProvidersService } from '../../../services/providers.service';
import { Sector, Sectors } from '../../../interfaces/sector.interface';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal-sectors',
  templateUrl: './modal-sectors.component.html',
  styles: [
  ]
})
export class ModalSectorsComponent implements OnInit, OnDestroy {
  providersService = inject(ProvidersService);
  loading = signal(false);
  sectors = signal<Sectors|undefined>(undefined);
  rows      = signal(50);
  page      = signal(1);
  status    = signal(true);
  type      = signal('');
  query     = signal('');
  fieldSort = signal('');
  order     = signal('');
  save$!: Subscription;
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRES', code: 'name'},
    {name: 'COD', code: 'id'},
  ]);
  cols = signal<ColsTable[]>([
    { field: 'id', header: 'COD' , style:'min-width:80px;', tooltip: true},
    { field: `name`, header: 'SECTOR' , style:'min-width:150px;',tooltip: true  },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:80px;max-width:80px', isButton:true,
    }
  ]);
  ngOnInit(): void {
    this.getAllAndSearchSectors(1,this.rows(),true);
    this.save$ = this.providersService.reloadCategoriesSectors$.subscribe(resp => this.getAllAndSearchSectors(this.page(),this.rows(),this.status()));
  }
  
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }

  paginate($rows:any) {
    const {rows, page} = $rows;
    this.rows.set(rows);
    this.page.set(page);
    this.getAllAndSearchSectors(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchSectors(1,this.rows(),this.status(),this.type(),this.query());
  }


  getAllAndSearchSectors(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.providersService.getAllSectorProvider(page,limit,status,type,query,this.fieldSort(),this.order()).subscribe({
      next: (resp) => {
        this.sectors.set(resp.sectors);
        this.sectors()!.data.forEach((sector) => {
          sector.options = [
            {
              label:'Eliminar',icon:'fa-solid fa-trash-can', 
              tooltip: 'Eliminar',
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.deleteSector(sector);
              }
            },
          ];
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  deleteSector(sector: Sector) {
    Swal.fire({
      title: `¿Esta seguro de dar de baja definitivamente?`,
      text: `Esta apunto de Eliminar a ${sector.name}`,
      icon: 'warning',
      confirmButtonText: `Si, Dar de baja!`,
      showLoaderOnConfirm: true,
      showCancelButton: true,
      backdrop:true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancelar',
      customClass: { container: 'sweetalert2'},
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          this.providersService.deleteSector(sector.id).subscribe({
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
        this.providersService.reloadCategoriesSectors$.next(true);
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Se ha dado de baja al sector`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'sweetalert2'},
        });
      }
    });
  }
}
