import { Component, inject } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-config-input',
  templateUrl: './modal-config-input.component.html',
  styles: [
  ]
})
export class ModalConfigInputComponent {
  inputsService = inject( InputsService );
  fb            = inject( FormBuilder );
  formConfig: UntypedFormGroup  = this.fb.group({
    searchForCode: localStorage.getItem('searchForCode') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearch') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProducts') === 'true' ? true : false,
    printSale: localStorage.getItem('printAfter') === 'false' ? false : true,
  });

  saveConfig(): void {
    localStorage.setItem('searchForCode',  this.formConfig.get('searchForCode')!.value);
    localStorage.setItem('viewCardProducts',  this.formConfig.get('viewCardProducts')!.value);
    localStorage.setItem('printAfter',  this.formConfig.get('printSale')!.value);
    localStorage.setItem('clearInputAfterProductSearch', this.formConfig.get('clearInputAfterProductSearch')!.value);
    this.inputsService._inputConfig = this.formConfig.value;
    this.inputsService.showModalConfigInput = false;
  }
}
