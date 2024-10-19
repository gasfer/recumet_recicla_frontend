import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProvidersService } from '../../../services/providers.service';
import Swal from 'sweetalert2';
import { CategoriesService } from 'src/app/pages/inventories/services/categories.service';

@Component({
  selector: 'app-modal-provider',
  templateUrl: './modal-provider.component.html',
  styles: []
})

export class ModalProviderComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  providersService  = inject( ProvidersService );
  categoriesService = inject( CategoriesService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  isEditSub$!: Subscription;
  isReloadSub$!: Subscription;
  types = signal<{name:string, code:string, id:string}[]>([]);
  categories = signal<{name:string,code:string}[]>([]);
  sectors = signal<{name:string,code:string}[]>([]);
  frequencies = signal<{name: string, code: string}[]>([
    { name: 'QUINCENAL', code: 'QUINCENAL' },
    { name: 'MENSUAL', code: 'MENSUAL' },
    { name: 'TRIMESTRAL', code: 'TRIMESTRAL' },
    { name: 'SEMESTRAL', code: 'SEMESTRAL' },
    { name: 'ANUAL', code: 'ANUAL' },
  ]);
  providerForm: FormGroup = this.fb.group({
    id: [''],
    full_names: [ '', [Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    id_sector: [ '', [ Validators.required]],
    number_document: [null, [Validators.maxLength(50)]],
    cellphone: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    direction: [ null, [Validators.maxLength(254)]],
    id_type_provider: ['', [Validators.required]],
    mayorista: [ false, []],
    name_contact: [ null, [Validators.maxLength(174)]],
    cellphone_contact: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    id_category: [ '', [Validators.required]],
    id_sucursal: [ null],
    companyContacts:[ '', [Validators.maxLength(254)]],
    frequency:[ '', [Validators.maxLength(254)]],
    workAreaOrPositionOrUnit: ['', [Validators.maxLength(254)]],
    status: [true]
  });

  formP = {
    full_names: { label: '', view: true },
    id_sector: { label: '', view: true },
    number_document: { label: '', view: true },
    cellphone: { label: '', view: true },
    direction: { label: '', view: true },
    mayorista: { label: '', view: true },
    name_contact: { label: '', view: true },
    cellphone_contact: { label: '', view: true },
    id_category: { label: '', view: true },
    status: { label: '', view: true },
    companyContacts: { label: '', view: true},
    frequency: { label: '', view: true},
    workAreaOrPositionOrUnit: { label: '', view: true},
  };
  ngOnInit(): void {
    this.getAllCategories();
    this.getAllSectors();
    this.getAllTypes();
    this.isEditSub$ = this.providersService.editSubs.subscribe(resp => {
      this.providerForm.reset({
        id: resp.id,
        full_names: resp.full_names,
        id_sector: resp.sector.id.toString(),
        number_document: resp.number_document,
        cellphone: resp.cellphone,
        direction: resp.direction,
        id_type_provider: {
          name: resp.type?.name.toString(),
          code:resp.type?.code.toString(),
          id: resp.type?.id.toString(),
        },
        mayorista: resp.mayorista,
        name_contact: resp.name_contact,
        companyContacts: resp.companyContacts,
        frequency: resp.frequency,
        workAreaOrPositionOrUnit: resp.workAreaOrPositionOrUnit,
        cellphone_contact: resp.cellphone_contact,
        id_category: resp.id_category.toString(),
        status: resp.status,
      });
    });
    this.isReloadSub$ = this.providersService.reloadCategoriesSectors$
                            .subscribe(resp=>{
                                this.providerForm.patchValue({id_sector: ''});
                                this.getAllSectors()
                            });
  }
  
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
    this.isReloadSub$.unsubscribe();
  }

  getAllCategories() {
    this.categories.set([]);
    this.categoriesService.getAllAndSearch(1,1000,true).subscribe(resp => {
      const formattedCategory = resp.categories.data.map(category => ({
        name: category.name,
        code: category.id!.toString()
      }));
      this.categories.set(formattedCategory);
    });
  }

  getAllSectors() {
    this.sectors.set([]);
    this.providersService.getAllSectorProvider(1,10000,true).subscribe(resp => {
      const formattedSector = resp.sectors.data.map(sector => ({
        name: sector.name,
        code: sector.id!.toString()
      }));
      this.sectors.set(formattedSector);
    });
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
        this.providerForm.get('id_type_provider')?.setValue({
          name: formattedType[0].name,
          id: formattedType[0].id!.toString(),
          code: formattedType[0].code,
        });
        this.changeLabelAndForm();
      }
    });
  }
  
  newProvider() {
    this.providerForm.markAllAsTouched();
    if(!this.providerForm.valid) return;
    this.loading.set(true);
    const id_type_provider = this.providerForm.get('id_type_provider')?.value;
    this.providerForm.patchValue({
      id_type_provider:id_type_provider.id
    })
    this.providersService.postNew(this.providerForm.value).subscribe({
      complete: () => {
        this.providersService.save$.next(true);
        this.loading.set(false);
        this.providersService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Proveedor nuevo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editProvider() {
    this.providerForm.markAllAsTouched();
    if(!this.providerForm.valid) return;
    this.loading.set(true);
    const id_type_provider = this.providerForm.get('id_type_provider')?.value;
    this.providerForm.patchValue({
      id_type_provider:id_type_provider.id
    })
    this.providersService.putUpdate(this.providerForm.value).subscribe({
      complete: () => {
        this.providersService.save$.next(true);
        this.loading.set(false);
        this.providersService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Proveedor modificado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.resetForm();
    if(this.types().length > 0) {
      this.providerForm.get('id_type_provider')?.setValue({
        name: this.types()[0].name,
        id: this.types()[0].id!.toString(),
        code: this.types()[0].code,
      });
      this.changeLabelAndForm();
    }
  }

  resetForm() {
    this.providerForm.patchValue({
      id: '',
      full_names: '',
      id_sector: '',
      number_document: null,
      cellphone: null,
      direction: null,
      type: '',
      mayorista: false,
      name_contact: null,
      cellphone_contact: null,
      id_category: '',
      id_sucursal: null,
      companyContacts: '',
      frequency: '',
      workAreaOrPositionOrUnit: '',
      status: true,
    });
  }

  changeLabelAndForm() {
    this.resetForm();
    const type = this.providerForm.get('id_type_provider')?.value;
    const defaultFormConfig = {
      full_names: { label: '', view: true },
      number_document: { label: '', view: false },
      direction: { label: '', view: true },
      companyContacts: { label: '', view: false },
      id_sector: { label: 'Sector(zonas)', view: true },
      mayorista: { label: '', view: false },
      name_contact: { label: 'Nombre persona de contacto', view: true },
      cellphone_contact: { label: 'Celular persona de contacto.', view: true },
      workAreaOrPositionOrUnit: { label: '', view: false },
      id_category: { label: 'Categoría(tipo de material que entrega)', view: true },
      frequency: { label: 'Frecuencia', view: true },
      //default no document
      cellphone: { label: 'Celular', view: true },
      status: { label: 'Estado:', view: true },
    };
    
    switch (type?.code) {
      case 'A':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de empresa', view: true },
          number_document: { label: 'Nit empresa', view: true },
          direction: { label: 'Dirección empresa', view: true },
          companyContacts: { label: 'Contactos empresa', view: true },
          workAreaOrPositionOrUnit: { label: 'Área de trabajo o cargo o unidad dependiente', view: true },
        };
        break;
      case 'B':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre del taller o negocio', view: true },
          direction: { label: 'Dirección del taller o negocio', view: true },
        };
        break;
      case 'C':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de la acopiadora mayorista', view: true },
          direction: { label: 'Dirección de la acopiadora mayorista', view: true },
          mayorista: {  label: 'Mayorista o minorista', view: true},
        };
        break;
      case 'D':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: '', view: false },
          direction: { label: 'Dirección de la acopiadora minorista', view: true },
          mayorista: {  label: 'Mayorista o minorista', view: true},
        };
        break;
      case 'E':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: '', view: false },
          direction: { label: '', view: false },
        };
        break;
      case 'F':
        this.formP = {
          ...defaultFormConfig,
          full_names: { label: 'Nombre de empresa publica', view: true },
          number_document: {label:'Nit empresa', view: true},
          direction: { label: 'Dirección empresa', view: true },
          companyContacts: { label: 'Contactos empresa', view:true },
          workAreaOrPositionOrUnit: {label: 'Área de trabajo o cargo o unidad dependiente', view: true},
        };
        break;          
      default:
        this.formP = { ...defaultFormConfig };
        break;
    }
  }
}
