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
  types = signal<{name:string, code:string}[]>([]);
  categories = signal<{name:string,code:string}[]>([]);
  sectors = signal<{name:string,code:string}[]>([]);
  providerForm: FormGroup = this.fb.group({
    id: [''],
    full_names: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(174),this.validatorsService.isSpacesInDynamicTxt]],
    id_sector: [ '', [ Validators.required]],
    number_document: [null, [Validators.maxLength(50)]],
    cellphone: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    direction: [ null, [Validators.maxLength(254)]],
    id_type_provider: ['', [Validators.required]],
    mayorista: [ false, [Validators.required]],
    name_contact: [ null, [Validators.maxLength(174)]],
    cellphone_contact: [ null, [Validators.min(60000000),Validators.max(79999999)]],
    id_category: [ '', [Validators.required]],
    id_sucursal: [ null],
    status: [true]
  });

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
        type: resp.type,
        mayorista: resp.mayorista,
        name_contact: resp.name_contact,
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
        code: type.id!.toString()
      }));
      this.types.set(formattedType);
    });
  }
  
  newProvider() {
    this.providerForm.markAllAsTouched();
    if(!this.providerForm.valid) return;
    this.loading.set(true);
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
    this.providerForm.reset({
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
      status: true,
    });
  }
}
