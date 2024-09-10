import { Component, inject } from '@angular/core';
import { TransfersService } from '../../../services/transfers.service';
import { FormBuilder, UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-modal-config-transfer',
  templateUrl: './modal-config-transfer.component.html',
  styles: [
  ]
})
export class ModalConfigTransferComponent {
  transfersService = inject( TransfersService );
  fb               = inject( FormBuilder );
  formConfig: UntypedFormGroup  = this.fb.group({
    searchForCode: localStorage.getItem('searchForCodeTr') === 'true' ? true : false,
    clearInputAfterProductSearch: localStorage.getItem('clearInputAfterProductSearchTr') === 'false' ? false : true,
    viewCardProducts: localStorage.getItem('viewCardProductsTr') === 'true' ? true : false,
    printSale: localStorage.getItem('printAfterTr') === 'false' ? false : true,
  });

  saveConfig(): void {
    localStorage.setItem('searchForCodeTr',  this.formConfig.get('searchForCode')!.value);
    localStorage.setItem('viewCardProductsTr',  this.formConfig.get('viewCardProducts')!.value);
    localStorage.setItem('printAfterTr',  this.formConfig.get('printSale')!.value);
    localStorage.setItem('clearInputAfterProductSearchTr', this.formConfig.get('clearInputAfterProductSearch')!.value);
    this.transfersService._transferConfig = this.formConfig.value;
    this.transfersService.showModalConfigTransfer = false;
  }
}
