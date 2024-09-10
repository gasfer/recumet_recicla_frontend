import { Component, inject } from '@angular/core';
import { OutputService } from '../../../services/output.service';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-config-output',
  templateUrl: './modal-config-output.component.html',
  styles: [
  ]
})
export class ModalConfigOutputComponent {
  outputService = inject( OutputService );
  fb            = inject( FormBuilder );
  formConfig: UntypedFormGroup  = this.fb.group({
    searchForCode: localStorage.getItem('searchForCodeO') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearchO') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProductsO') === 'true' ? true : false,
    printSale: localStorage.getItem('printAfterO') === 'false' ? false : true,
  });

  saveConfig(): void {
    localStorage.setItem('searchForCodeO',  this.formConfig.get('searchForCode')!.value);
    localStorage.setItem('viewCardProductsO',  this.formConfig.get('viewCardProducts')!.value);
    localStorage.setItem('printAfterO',  this.formConfig.get('printSale')!.value);
    localStorage.setItem('clearInputAfterProductSearchO', this.formConfig.get('clearInputAfterProductSearch')!.value);
    this.outputService._outputConfig = this.formConfig.value;
    this.outputService.showModalConfigInput = false;
  }
}
