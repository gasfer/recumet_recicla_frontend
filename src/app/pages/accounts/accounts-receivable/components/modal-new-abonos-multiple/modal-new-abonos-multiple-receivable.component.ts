import { Component, OnInit, inject, signal } from '@angular/core';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { AccountsReceivableService } from '../../../services/accounts-receivable.service';
import { AccountsPayableClient } from '../../../interfaces/accounts-payable-client.interface';
import Swal from 'sweetalert2';
import { AbonosAccountReceivableAllService } from '../../../services/abonos-accounts-receivable-all.service';

@Component({
  selector: 'app-modal-new-abonos-multiple-receivable',
  templateUrl: './modal-new-abonos-multiple-receivable.component.html',
  styles: [
  ]
})
export class ModalNewAbonosMultipleReceivableComponent {
  accountsPayableService            = inject(AccountsReceivableService);
  AbonosAccountReceivableAllService = inject(AbonosAccountReceivableAllService);
  validatorsService = inject(ValidatorsService);
  fb = inject(FormBuilder);
  loading = signal(false);
  types_pay = signal([{ name: 'EFECTIVO', code: 'EFECTIVO' }, { name: 'CHEQUE', code: 'CHEQUE' }, { name: 'TRANSFERENCIA', code: 'TRANSFERENCIA' }]);
  accountsPayableClient = signal<AccountsPayableClient | undefined>(undefined);
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  banks = signal<Bank[]>([]);
  viewDetailsSub$!: Subscription;
  bankService = inject(BankService);
  nameClient = signal('');
  abonoForm: FormGroup = this.fb.group({
    id_client: [],
    date_abono: [new Date(), [Validators.required]],
    monto_abono: [0],
    type_payment: ['EFECTIVO', [Validators.required]],
    comments: [null, []],
    id_sucursal: [null, [Validators.required]],
    account_input: [null, []],
    id_bank: [null, []],
  });

  ngOnInit(): void {
    this.viewDetailsSub$ = this.accountsPayableService.detailsSubs$.subscribe(accountPayable => {
      this.nameClient.set(accountPayable.client.full_names);
      this.getAccountsForClient(accountPayable.id_client);
    });
    this.getAllBanks();
  }

  getAccountsForClient(id_client: number) {
    this.loading.set(true);
    this.accountsPayableService.getAccountsPayableForClient(id_client).subscribe(resp => {
      if(resp.accountsReceivable.data.length == 0) {
        this.accountsPayableService.showModalAccountsClient = false;
        return;
      }
      this.accountsPayableClient.set(resp.accountsReceivable);
      this.abonoForm.patchValue({
        id_client: id_client,
        monto_abono: resp.accountsReceivable.totals.total_restante
      })
      this.loading.set(false);
    });
  }

  newAbono() {
    this.abonoForm.patchValue({ id_sucursal: this.validatorsService.id_sucursal()});
    this.abonoForm.markAllAsTouched();
    if (!this.abonoForm.valid) return;
    this.loading.set(true);
    this.AbonosAccountReceivableAllService.postNewAbonoMultipleAccountReceivable(this.abonoForm.value).subscribe({
      next: (resp) => {
        this.loading.set(false);
        //si paga todo cerramos el modal de detalle
        this.accountsPayableService.reloadAccountsReceivable$.next(0);
        Swal.fire({
          title: 'Éxito!',
          text: `Abono nuevo agregado correctamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
        this.getAccountsForClient(this.abonoForm.get('id_client')?.value);
      },
      error: (error) => {
        Swal.fire({
          title: 'Advertencia!',
          text: error?.error?.errors[0]?.msg ? error?.error?.errors[0]?.msg : 'Los datos no son validos, Intenta nuevamente',
          icon: 'warning',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
        this.loading.set(false);
      }
    });
  }

  resetModal() {
    this.abonoForm.reset({
      id_client: null,
      date_abono: new Date(),
      monto_abono: 0,
      comments: null,
      type_payment: 'EFECTIVO',
      account_input: null,
      id_bank: null,
    });
  }


  selectTypePay() {
    const type_pay = this.abonoForm.get('type_payment')?.value;
    this.abonoForm.patchValue({
      account_input: null, id_bank: null
    });
    if (type_pay != 'EFECTIVO') {
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
    this.bankService.getAllAndSearch(1, 10000, true).subscribe({
      next: (resp) => this.banks.set(resp.banks.data),
      error: () => this.banks.set([])
    });
  }
}
