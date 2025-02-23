import { Component, OnInit, inject, signal } from '@angular/core';
import { AccountsPayableService } from '../../../services/accounts-payable.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { AccountsPayableProvider } from '../../../interfaces/accounts-payable-provider.interface';
import { AbonosAccountPayableAllService } from '../../../services/abonos-accounts-payable-all.service';

@Component({
  selector: 'app-modal-new-abonos-multiple-payable',
  templateUrl: './modal-new-abonos-multiple-payable.component.html',
  styles: [
  ]
})
export class ModalNewAbonosMultiplePayableComponent {
  accountsPayableService = inject(AccountsPayableService);
  AbonosAccountPayableAllService = inject(AbonosAccountPayableAllService);
  validatorsService = inject(ValidatorsService);
  fb = inject(FormBuilder);
  loading = signal(false);
  types_pay = signal([{ name: 'EFECTIVO', code: 'EFECTIVO' }, { name: 'CHEQUE', code: 'CHEQUE' }, { name: 'TRANSFERENCIA', code: 'TRANSFERENCIA' }]);
  accountsPayableProvider = signal<AccountsPayableProvider | undefined>(undefined);
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  banks = signal<Bank[]>([]);
  viewDetailsSub$!: Subscription;
  bankService = inject(BankService);
  nameProvider = signal('');
  abonoForm: FormGroup = this.fb.group({
    id_provider: [],
    date_abono: [new Date(), [Validators.required]],
    monto_abono: [0],
    type_payment: ['EFECTIVO', [Validators.required]],
    comments: [null, []],
    account_output: [null, []],
    id_sucursal: [null, [Validators.required]],
    id_bank: [null, []],
  });

  ngOnInit(): void {
    this.viewDetailsSub$ = this.accountsPayableService.detailsSubs$.subscribe(accountPayable => {
      this.nameProvider.set(accountPayable.provider.full_names);
      this.getAccountsForProvider(accountPayable.id_provider);
    });
    this.getAllBanks();
  }

  getAccountsForProvider(id_provider: number) {
    this.loading.set(true);
    this.accountsPayableService.getAccountsPayableForProvider(id_provider).subscribe(resp => {
      if(resp.accountsPayable.data.length == 0) {
        this.accountsPayableService.showModalAccountsProvider = false;
        return;
      }
      this.accountsPayableProvider.set(resp.accountsPayable);
      this.abonoForm.patchValue({
        id_provider: id_provider,
        monto_abono: resp.accountsPayable.totals.total_restante
      })
      this.loading.set(false);
    });
  }

  newAbono() {
    this.abonoForm.patchValue({ id_sucursal: this.validatorsService.id_sucursal()});
    this.abonoForm.markAllAsTouched();
    if (!this.abonoForm.valid) return;
    this.loading.set(true);
    this.AbonosAccountPayableAllService.postNewAbonoMultipleAccountPayable(this.abonoForm.value).subscribe({
      next: (resp) => {
        this.loading.set(false);
        //si paga todo cerramos el modal de detalle
        this.accountsPayableService.reloadAccountsPayable$.next(0);
        Swal.fire({
          title: 'Éxito!',
          text: `Abono nuevo agregado correctamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
        this.getAccountsForProvider(this.abonoForm.get('id_provider')?.value);
        this.AbonosAccountPayableAllService.printAbonoMultipleAccountPayablePdf(resp.id_abono_accounts_payable)

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
      id_provider: null,
      date_abono: new Date(),
      monto_abono: 0,
      comments: null,
      type_payment: 'EFECTIVO',
      account_output: null,
      id_bank: null,
    });
  }


  selectTypePay() {
    const type_pay = this.abonoForm.get('type_payment')?.value;
    this.abonoForm.patchValue({
      account_output: null, id_bank: null
    });
    if (type_pay != 'EFECTIVO') {
      this.abonoForm.get('account_output')?.setValidators([Validators.required]);
      this.abonoForm.get('id_bank')?.setValidators([Validators.required]);
    } else {
      this.abonoForm.get('account_output')?.clearValidators();
      this.abonoForm.get('id_bank')?.clearValidators();
    }
    this.abonoForm.get('account_output')?.updateValueAndValidity();
    this.abonoForm.get('id_bank')?.updateValueAndValidity();
  }

  getAllBanks() {
    this.bankService.getAllAndSearch(1, 10000, true).subscribe({
      next: (resp) => this.banks.set(resp.banks.data),
      error: () => this.banks.set([])
    });
  }
}
