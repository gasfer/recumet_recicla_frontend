import { Component, OnInit, inject, signal } from '@angular/core';
import { AccountsReceivableService } from '../../../services/accounts-receivable.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccountReceivable } from '../../../interfaces/accounts-receivable.interface';
import Swal from 'sweetalert2';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import { BankService } from 'src/app/pages/managements/services/bank.service';

@Component({
  selector: 'app-modal-new-abono-account-receivable',
  templateUrl: './modal-new-abono-account-receivable.component.html',
  styles: [
  ]
})
export class ModalNewAbonoAccountReceivableComponent implements OnInit {
  accountsReceivableService = inject(AccountsReceivableService);
  validatorsService         = inject( ValidatorsService );
  fb                        = inject( FormBuilder );
  loading                   = signal(false);
  types_pay              = signal([{name: 'EFECTIVO', code: 'EFECTIVO'},{name: 'CHEQUE', code: 'CHEQUE'},{name: 'TRANSFERENCIA', code: 'TRANSFERENCIA'}]);
  viewDetailsSub$!          : Subscription;
  accountReceivable         = signal<AccountReceivable|undefined>(undefined);
  decimalLength             = signal(this.validatorsService.decimalLength());
  banks                     = signal<Bank[]>([]);
  bankService               = inject( BankService );
  
  abonoForm: FormGroup = this.fb.group({
    id_account_receivable: [],
    date_abono: [new Date(), [ Validators.required]],
    monto_abono: [0],
    type_payment: ['EFECTIVO',[Validators.required]],
    comments: [null,[]],
    account_input: [null,[]],
    id_bank: [null,[]],
  });

  ngOnInit(): void {
    this.viewDetailsSub$ = this.accountsReceivableService.detailsSubs$.subscribe(accountReceivable => {
      this.accountReceivable.set(accountReceivable);
      this.abonoForm.get('monto_abono')?.clearValidators();
      this.abonoForm.get('monto_abono')?.addValidators([Validators.min(0),Validators.max(accountReceivable.monto_restante)]);
      this.abonoForm.patchValue({
        id_account_receivable: accountReceivable.id,
        monto_abono:accountReceivable.monto_restante,
      })
    });
    this.getAllBanks();
  }

  newAbono() {
    this.abonoForm.markAllAsTouched();
    if(!this.abonoForm.valid) return;
    this.loading.set(true);
    this.accountsReceivableService.postNewAbonoAccountReceivable(this.abonoForm.value).subscribe({
      next: (resp) => {
        this.accountsReceivableService.reloadAccountsReceivable$.next(this.abonoForm.get('id_account_receivable')?.value);
        this.loading.set(false);
        this.accountsReceivableService.showModalNewAbono = false;
        //si paga todo cerramos el modal de detalle
        if(this.accountReceivable()?.monto_restante == this.abonoForm.get('monto_abono')?.value) {
          this.accountsReceivableService.showModalDetailsAccountReceivable = false;
        }
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Abono nuevo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        }).then(() => this.accountsReceivableService.printVoucherAbonoAccountReceivablePdf(resp.abonosAccountsReceivable.id));
      },
      error: (error) => {
        Swal.fire({ 
          title: 'Advertencia!', 
          text: error?.error?.errors[0]?.msg ? error?.error?.errors[0]?.msg : 'Los datos no son validos, Intenta nuevamente',
          icon: 'warning', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.loading.set(false); 
      }
    });
  }

  resetModal() { 
    this.abonoForm.reset({
      id_account_receivable: null,
      date_abono: new Date(),
      monto_abono: 0,
      comments: null,
      account_input: null,
      type_payment: 'EFECTIVO',
      id_bank:null,
    });
  }

  selectTypePay() {
    const type_pay = this.abonoForm.get('type_payment')?.value;
    this.abonoForm.patchValue({
      account_input: null, id_bank: null
    });
    if(type_pay != 'EFECTIVO') {
      this.abonoForm.get('account_input')?.setValidators([Validators.required]);
      this.abonoForm.get('id_bank')?.setValidators([Validators.required]);
    } else {
      this.abonoForm.get('account_input')?.clearValidators();
      this.abonoForm.get('id_bank')?.clearValidators();
    }
    this.abonoForm.get('account_input')?.updateValueAndValidity();
    this.abonoForm.get('id_bank')?.updateValueAndValidity();
  }

  getAllBanks() {
    this.bankService.getAllAndSearch(1,10000,true).subscribe({
      next: (resp) => this.banks.set(resp.banks.data),
      error: () => this.banks.set([])
    });
  }
}
