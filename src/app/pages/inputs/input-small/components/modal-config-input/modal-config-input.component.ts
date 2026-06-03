import { Component, OnInit, inject } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-config-input',
  templateUrl: './modal-config-input.component.html',
  styles: [
  ]
})
export class ModalConfigInputComponent implements OnInit {
  inputsService = inject( InputsService );
  fb            = inject( FormBuilder );
  formConfig: UntypedFormGroup  = this.fb.group({
    searchForCode: localStorage.getItem('searchForCode') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearch') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProducts') === 'true' ? true : false,
    printSale: localStorage.getItem('printAfter') === 'false' ? false : true,
    printRoll: localStorage.getItem('printRoll') === 'true' ? true : false,
    printHalfPage: localStorage.getItem('printHalfPage') === 'true' ? true : false,
  });

  ngOnInit(): void {
    this.formConfig.get('printRoll')?.valueChanges.subscribe(val => {
      if (val) {
        this.formConfig.get('printHalfPage')?.setValue(false, { emitEvent: false });
      }
    });
    this.formConfig.get('printHalfPage')?.valueChanges.subscribe(val => {
      if (val) {
        this.formConfig.get('printRoll')?.setValue(false, { emitEvent: false });
      }
    });
  }

  saveConfig(): void {
    localStorage.setItem('searchForCode',  this.formConfig.get('searchForCode')!.value);
    localStorage.setItem('viewCardProducts',  this.formConfig.get('viewCardProducts')!.value);
    localStorage.setItem('printAfter',  this.formConfig.get('printSale')!.value);
    localStorage.setItem('clearInputAfterProductSearch', this.formConfig.get('clearInputAfterProductSearch')!.value);
    localStorage.setItem('printRoll', this.formConfig.get('printRoll')!.value);
    localStorage.setItem('printHalfPage', this.formConfig.get('printHalfPage')!.value);
    
    this.inputsService._inputConfig = {
      searchForCode: this.formConfig.get('searchForCode')!.value,
      viewCardProducts: this.formConfig.get('viewCardProducts')!.value,
      printAfter: this.formConfig.get('printSale')!.value,
      clearInputAfterProductSearch: this.formConfig.get('clearInputAfterProductSearch')!.value,
      printRoll: this.formConfig.get('printRoll')!.value,
      printHalfPage: this.formConfig.get('printHalfPage')!.value,
      viewMoneyButtons: this.inputsService._inputConfig.viewMoneyButtons
    };
    this.inputsService.showModalConfigInput = false;
  }
}
