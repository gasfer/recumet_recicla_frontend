import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { CategoriesService } from '../../../services/categories.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-category',
  templateUrl: './modal-category.component.html',
  styles: [
  ]
})
export class ModalCategoryComponent implements OnInit, OnDestroy {
  validatorsService = inject( ValidatorsService );
  categoriesService = inject( CategoriesService );
  fb                = inject( FormBuilder );
  loading           = signal(false);
  isEditSub$!: Subscription;
  categoryForm: FormGroup = this.fb.group({
    id: [''],
    name: [ '', [ Validators.required,Validators.minLength(2),Validators.maxLength(100),this.validatorsService.isSpacesInDynamicTxt]],
    description: ['', [ Validators.required,Validators.minLength(2),Validators.maxLength(175),this.validatorsService.isSpacesInDynamicTxt]],
    status: [true]
  });

  ngOnInit(): void {
    this.isEditSub$ = this.categoriesService.editSubs.subscribe(resp => {
      this.categoryForm.reset({
        id: resp.id,
        name: resp.name,
        description: resp.description,
        status: resp.status,
      });
    });
  }
  ngOnDestroy(): void {
    this.isEditSub$.unsubscribe();
  }
  
  newCategory() {
    this.categoryForm.markAllAsTouched();
    if(!this.categoryForm.valid) return;
    this.loading.set(true);
    this.categoriesService.postNew(this.categoryForm.value).subscribe({
      complete: () => {
        this.categoriesService.save$.next(true);
        this.loading.set(false);
        this.categoriesService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Categoría nueva agregada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  editCategory() {
    this.categoryForm.markAllAsTouched();
    if(!this.categoryForm.valid) return;
    this.loading.set(true);
    this.categoriesService.putUpdate(this.categoryForm.value).subscribe({
      complete: () => {
        this.categoriesService.save$.next(true);
        this.loading.set(false);
        this.categoriesService.showModal = false;
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Categoría modificada correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
      },
      error: () => this.loading.set(false) 
    });
  }

  resetModal() { 
    this.categoryForm.reset({
      name: '',
      description: '',
      status: true,
    });
  }
}
