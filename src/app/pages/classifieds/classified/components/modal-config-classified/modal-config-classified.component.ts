import { Component, inject } from '@angular/core';
import { ClassifiedService } from '../../../services/classified.service';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-config-classified',
  templateUrl: './modal-config-classified.component.html',
  styles: [
  ]
})
export class ModalConfigClassifiedComponent {
  classifiedService = inject( ClassifiedService );
  fb                = inject( FormBuilder );
  formConfig: UntypedFormGroup  = this.fb.group({
    searchForCode: localStorage.getItem('searchForCodeC') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearchC') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProductsC') === 'true' ? true : false,
    printSale: localStorage.getItem('printAfterC') === 'false' ? false : true,
  });

  saveConfig(): void {
    localStorage.setItem('searchForCodeC',  this.formConfig.get('searchForCode')!.value);
    localStorage.setItem('viewCardProductsC',  this.formConfig.get('viewCardProducts')!.value);
    localStorage.setItem('printAfterC',  this.formConfig.get('printSale')!.value);
    localStorage.setItem('clearInputAfterProductSearchC', this.formConfig.get('clearInputAfterProductSearch')!.value);
    this.classifiedService._classifiedConfig = this.formConfig.value;
    this.classifiedService.showModalConfigClassified = false;
  }
}
