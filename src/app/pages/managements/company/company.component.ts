import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Companies, Company } from '../interfaces/companies.interfaces';
import { Subscription } from 'rxjs';
import { CompaniesService } from '../services/companies.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styles: [
  ]
})
export class CompanyComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {this.getAllAndSearchCompanies(1,50,true);}},
  ]);
  cols = signal<ColsTable[]>([
    { field: 'name', header: 'NOMBRE' , style:'min-width:200px;', tooltip: true},
    { field: `nit`, header: 'NIT' , style:'min-width:100px;max-width:150px;', tooltip: true  },
    { field: `razon_social`, header: 'RAZÓN SOCIAL' , style:'min-width:120px;max-width:100px;',tooltip: true , isText: true },
    { field: `activity`, header: 'ACTIVIDAD' , style:'min-width:220px;max-width:250px;',tooltip: true, isText: true   },
    { field: `email`, header: 'CORREO' , style:'min-width:120px;max-width:200px;',tooltip: true, isText: true   },
    { field: `cellphone`, header: 'CELULAR/TELÉFONO' , style:'min-width:150px;max-width:250px;',tooltip: true, isText: true   },
    { field: `address`, header: 'DIRECCIÓN' , style:'min-width:150px;',tooltip: true , isText: true },
    { 
      field: 'options', header: 'OPCIONES', style:'min-width:120px;max-width:120px', isButton:true, activeSortable: false
    }
  ]);
  loading = signal(false);
  companies = signal<Companies|undefined>(undefined);
  private companiesService = inject(CompaniesService);
  validatorsService = inject(ValidatorsService);
  save$!: Subscription;

  ngOnInit(): void {
    this.getAllAndSearchCompanies(1,50,true);
    this.save$ = this.companiesService.save$.subscribe(resp => this.getAllAndSearchCompanies(1,50,true));
  }

  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 
  getAllAndSearchCompanies(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.companiesService.getAllAndSearch(page,limit,status,type,query).subscribe({
      next: (resp) => {
        this.companies.set(resp.companies);
        this.companies()!.data.forEach((company) => {
          company.options = [
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('EMPRESA','update'),
              class:'p-button-rounded p-button-warning p-button-sm',
              eventClick: () => {
                this.editShowModal(company);
              }
            },
          ];
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  editShowModal(company:Company) {
    this.companiesService.editSubs.emit(company);
    this.companiesService.showModal = true;
  }
}
