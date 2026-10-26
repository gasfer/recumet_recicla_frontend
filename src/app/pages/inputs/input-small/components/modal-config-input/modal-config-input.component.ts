import { Component, OnInit, inject } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-config-input',
  templateUrl: './modal-config-input.component.html',
  styles: [`
    :host ::ng-deep .purchase-config-dialog .p-dialog-header { background:var(--color-table-header); color:var(--color-text-inverse); }
    :host ::ng-deep .purchase-config-dialog .p-dialog-title { color:var(--color-text-inverse); }
    .purchase-config-options { padding:.65rem .8rem!important; }
    .purchase-config-options .field-checkbox { margin:0; min-height:34px; padding:.3rem .1rem!important; border-bottom:1px solid var(--color-border); }
    .purchase-config-options .field-checkbox:last-child { border-bottom:0; }
    .purchase-config-options label { color:var(--color-text); font-size:.8rem; line-height:1.35; }
  `]
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
