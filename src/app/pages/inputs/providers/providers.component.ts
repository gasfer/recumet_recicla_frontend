import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { Provider, Providers } from '../interfaces/provider.interface';
import { ProvidersService } from '../services/providers.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Router } from '@angular/router';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-providers',
  templateUrl: './providers.component.html',
  styles: [`
      .title {
        display: flex; 
        justify-content: space-between; 
        align-items: center;
      }
    
  `]
})
export class ProvidersComponent implements OnInit, OnDestroy {
  searchItems = signal<MenuItem[]>([
    { label: 'Activos',   icon: 'fa-solid fa-circle-check' ,command: () => {
      this.type.set('');
      this.getAllAndSearchProviders(1,this.rows(),true);
    }},
    { label: 'Inactivos', icon: 'fa-solid fa-trash-can', command: () => {
      this.type.set('');
      this.getAllAndSearchProviders(1,this.rows(),false)
    } },
  ]);
  cols = signal<ColsTable[]>([]);
  searchFor = signal<SearchFor[]>([
    {name: 'NOMBRES', code: 'full_names'},
    {name: 'SECTOR', code: 'sector.name'},
    {name: 'DOCUMENTO', code: 'number_document'},
    {name: 'CELULAR', code: 'cellphone'},
    {name: 'DIRECCIÓN', code: 'direction'},
    {name: 'TIPO', code: 'type.name'},
    {name: 'CONTACTO', code: 'name_contact'},
    {name: 'CELULAR C.', code: 'cellphone_contact'},
    {name: 'CATEGORÍA', code: 'category.name'},
  ]);
  loading   = signal(false);
  rows      = signal(50);
  fieldSort = signal('');
  order     = signal('');
  page      = signal(1);
  status    = signal(true);
  type      = signal('');
  query     = signal('');
  types = signal<{name:string, code:string}[]>([]);
  types_filtrado = signal([
    {name: 'DIA', code: 'DAY'},
    {name: 'MES', code: 'MONTH'},
    {name: 'AÑO', code: 'YEAR'},
    {name: 'RANGO', code: 'RANGE'},
  ]);
  providers = signal<Providers|undefined>(undefined);
  private providersService = inject(ProvidersService);
  validatorsService = inject(ValidatorsService);
  router            = inject(Router);
  fb                = inject(FormBuilder);
  save$!: Subscription;
  formReport:UntypedFormGroup = this.fb.group({
    id_type_provider: [],
  });
  ngOnInit(): void {
    this.getAllTypes();
    this.save$ = this.providersService.save$.subscribe(resp => this.getAllAndSearchProviders(this.page(),this.rows(),this.status()));
  }
  ngOnDestroy(): void {
    this.save$.unsubscribe();
  }
 

  getAllAndSearchProviders(page: number, limit: number, status:boolean,type: string = '', query: string = '') {
    if(!query) {this.loading.set(true);} //not loading in search
    this.status.set(status);
    this.loadColsTableByType();
    const id_type_provider = this.formReport.get('id_type_provider')?.value ?? '';
    this.providersService.getAllAndSearch(page,limit,status,type,query,this.fieldSort(),this.order(),id_type_provider.id).subscribe({
      next: (resp) => {
        this.providers.set(resp.providers);
        this.providers()!.data.forEach((provider) => {
          provider.options = provider.status  ? [
            { 
              label:'',icon:'fa-solid fa-comment-dollar', 
              tooltip: 'Cuentas por pagar',
              disabled: this.validatorsService.withPermission('CUENTAS POR COBRAR','view'),
              class:'p-button-rounded  p-button-sm',
              eventClick: () => {
                this.router.navigateByUrl(`/accounts/accounts-payable?p=${provider.id}`)
              }
            },
            { 
              label:'',icon:'fas fa-edit', 
              tooltip: 'Editar',
              disabled: this.validatorsService.withPermission('PROVEEDORES','update'),
              class:'p-button-rounded p-button-warning p-button-sm ms-1',
              eventClick: () => {
                this.editShowModal(provider);
              }
            },
            {
              label:'',icon:'fa-solid fa-trash-can', 
              tooltip: 'Inactivar',
              disabled: this.validatorsService.withPermission('PROVEEDORES','delete'),
              class:'p-button-rounded p-button-danger p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(provider,false);
              }
            },
          ] : [
            {
              label:'',icon:'fa-solid fa-circle-check',
              tooltip: 'Activar',
              disabled: this.validatorsService.withPermission('PROVEEDORES','delete'),
              class:'p-button-rounded p-button-sm ms-1',
              eventClick: () => {
                this.updateStatus(provider,true);
              }
            },
          ] ;
        });
      },
      complete: () =>  this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  updateStatus(provider: Provider,newStatus: boolean) {
    const statusText = newStatus ? 'Activar' : 'Inactivar';
    Swal.fire({
      title: `¿${statusText} Proveedor?`,
      text: `Esta apunto de ${statusText} a ${provider.full_names}`,
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
          this.providersService.putInactiveOrActive(provider.id!,newStatus).subscribe({
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
        this.getAllAndSearchProviders(1,this.rows(),!newStatus);
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
    this.getAllAndSearchProviders(this.page(),this.rows(),this.status(),this.type(),this.query())
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
    this.getAllAndSearchProviders(1,this.rows(),this.status(),this.type(),this.query());
  }

  showModal() {
    this.providersService.isEdit = false;
    this.providersService.showModal = true;
  }

  editShowModal(provider:Provider) {
    this.providersService.isEdit = true;
    this.providersService.editSubs.emit(provider);
    this.providersService.showModal = true;
  }

  onChangeTypesFilter() {
    const type_filter = this.formReport.get('filterBy')?.value;
    if(type_filter == 'RANGE'){
      this.formReport.get('dates')?.setValue([new Date()]);
    } else {
      this.formReport.get('dates')?.setValue(new Date());
    }
  }

  getAllTypes() {
    this.types.set([]);
    this.providersService.getAllTypesProvider().subscribe(resp => {
      const formattedType = resp.typesProvider.map(type => ({
        name: type.name,
        id: type.id!.toString(),
        code: type.code,
      }));
      this.types.set(formattedType);
      if(formattedType.length > 0) {
        this.formReport.get('id_type_provider')?.setValue({
          name: formattedType[0].name,
          id: formattedType[0].id!.toString(),
          code: formattedType[0].code,
        });
        this.getAllAndSearchProviders(1,this.rows(),true);
      }
    });
  }


  clearInputs() {
    this.formReport.patchValue({
      id_type_provider: '1',
    });
  }

  loadColsTableByType() {
    const type = this.formReport.get('id_type_provider')?.value;
    switch (type.code) {
      case 'A':
        this.cols.set([
          { field: 'full_names', header: 'EMPRESA' , style:'min-width:150px;max-width:300px;', tooltip: true, isText:true},
          { field: `number_document`, header: 'NIT' , style:'min-width:120px;max-width:120px;', tooltip: true , isText:true },
          { field: `direction`, header: 'DIRECCIÓN' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
          { field: `companyContacts`, header: 'CONTACTO' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
          { field: 'sector.name', header: 'SECTOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true},
          { field: `name_contact`, header: 'PERSONA NOMBRE' , style:'min-width:150px;max-width:200px;',tooltip: true , isText:true },
          { field: `cellphone_contact`, header: 'PERSONA CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: `workAreaOrPositionOrUnit`, header: 'AREA - UNIDAD' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:120px;max-width:150px;', tooltip: true , isText:true },
          { field: `frequency`, header: 'FRECUENCIA' , style:'min-width:120px;max-width:120px;', tooltip: true, isText:true  },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
        ]);
        break;
      case 'B':
          this.cols.set([
            { field: 'full_names', header: 'TALLER, NEGOCIO' , style:'min-width:150px;max-width:300px;', tooltip: true, isText:true},
            { field: `direction`, header: 'DIRECCIÓN' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
            { field: 'sector.name', header: 'SECTOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true},
            { field: `name_contact`, header: 'PERSONA NOMBRE' , style:'min-width:150px;max-width:200px;',tooltip: true , isText:true },
            { field: `cellphone_contact`, header: 'PERSONA CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
            { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:120px;max-width:150px;', tooltip: true , isText:true },
            { field: `frequency`, header: 'FRECUENCIA' , style:'min-width:120px;max-width:120px;', tooltip: true, isText:true  },
            { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
          ]);
        break;
      case 'C':
        this.cols.set([
          { field: 'full_names', header: 'ACOPIADORA MAYORISTA' , style:'min-width:150px;max-width:300px;', tooltip: true, isText:true},
          { field: `direction`, header: 'DIRECCIÓN' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
          { field: 'sector.name', header: 'SECTOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true},
          { field: `mayorista`, header: 'MAYOR.' , style:'min-width:100px;max-width:100px;', tooltip: true, isTag: true, 
            tagValue: (val:boolean)=> val ? 'SI' : 'NO',
            tagColor: (val:boolean)=> val ? 'primary' : 'success',
            tagIcon: (val:boolean)=> val ? 'fa-solid fa-truck' : 'fa-solid fa-people-carry-box',
          },
          { field: `name_contact`, header: 'PERSONA NOMBRE' , style:'min-width:150px;max-width:200px;',tooltip: true , isText:true },
          { field: `cellphone_contact`, header: 'PERSONA CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:120px;max-width:150px;', tooltip: true , isText:true },
          { field: `frequency`, header: 'FRECUENCIA' , style:'min-width:120px;max-width:120px;', tooltip: true, isText:true  },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
        ]);
        break;  
      case 'D':
        this.cols.set([
          { field: `direction`, header: 'DIRECCIÓN ACOPIADORA MINORISTA' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
          { field: 'sector.name', header: 'SECTOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true},
          { field: `mayorista`, header: 'MAYOR.' , style:'min-width:100px;max-width:100px;', tooltip: true, isTag: true, 
            tagValue: (val:boolean)=> val ? 'SI' : 'NO',
            tagColor: (val:boolean)=> val ? 'primary' : 'success',
            tagIcon: (val:boolean)=> val ? 'fa-solid fa-truck' : 'fa-solid fa-people-carry-box',
          },
          { field: `name_contact`, header: 'PERSONA NOMBRE' , style:'min-width:150px;max-width:200px;',tooltip: true , isText:true },
          { field: `cellphone_contact`, header: 'PERSONA CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:120px;max-width:150px;', tooltip: true , isText:true },
          { field: `frequency`, header: 'FRECUENCIA' , style:'min-width:120px;max-width:120px;', tooltip: true, isText:true  },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
        ]);
        break  
      case 'E':
        this.cols.set([
          { field: `name_contact`, header: 'PERSONA NOMBRE' , style:'min-width:150px;max-width:200px;',tooltip: true , isText:true },
          { field: `cellphone_contact`, header: 'PERSONA CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: 'sector.name', header: 'SECTOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true},
          { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:120px;max-width:150px;', tooltip: true , isText:true },
          { field: `frequency`, header: 'FRECUENCIA' , style:'min-width:120px;max-width:120px;', tooltip: true, isText:true  },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
        ]);
        break
      case 'F':
        this.cols.set([
          { field: 'full_names', header: 'EMPRESA PUBLICA' , style:'min-width:150px;max-width:300px;', tooltip: true, isText:true},
          { field: `number_document`, header: 'NIT' , style:'min-width:120px;max-width:120px;', tooltip: true , isText:true },
          { field: `direction`, header: 'DIRECCIÓN' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
          { field: `companyContacts`, header: 'CONTACTO' , style:'min-width:200px;max-width:200px;', tooltip: true , isText:true },
          { field: 'sector.name', header: 'SECTOR' , style:'min-width:150px;max-width:200px;', tooltip: true, isText:true},
          { field: `name_contact`, header: 'PERSONA NOMBRE' , style:'min-width:150px;max-width:200px;',tooltip: true , isText:true },
          { field: `cellphone_contact`, header: 'PERSONA CELULAR' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: `workAreaOrPositionOrUnit`, header: 'AREA - UNIDAD' , style:'min-width:120px;max-width:150px;', tooltip: true  , isText:true},
          { field: `category.name`, header: 'CATEGORÍA' , style:'min-width:120px;max-width:150px;', tooltip: true , isText:true },
          { field: `frequency`, header: 'FRECUENCIA' , style:'min-width:120px;max-width:120px;', tooltip: true, isText:true  },
          { field: 'options', header: 'OPCIONES', style:'min-width:130px;max-width:130px', isButton:true }
        ]);
        break
      default:
          this.cols.set([]);
        break;
    }
  }
}
