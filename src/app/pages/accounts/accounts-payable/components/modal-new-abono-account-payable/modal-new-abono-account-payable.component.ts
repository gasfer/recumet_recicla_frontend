import { Component, OnInit, inject, signal } from '@angular/core';
import { AccountsPayableService } from '../../../services/accounts-payable.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { AccountPayable } from '../../../interfaces/accounts-payable.interface';

@Component({
  selector: 'app-modal-new-abono-account-payable',
  templateUrl: './modal-new-abono-account-payable.component.html',
  styles: [
  ]
})
export class ModalNewAbonoAccountPayableComponent implements OnInit {
  accountsPayableService = inject(AccountsPayableService);
  validatorsService      = inject( ValidatorsService );
  fb                     = inject( FormBuilder );
  loading                = signal(false);
  viewDetailsSub$!       : Subscription;
  accountPayable         = signal<AccountPayable|undefined>(undefined);
  decimalLength         = signal(this.validatorsService.decimalLength());
  abonoForm: FormGroup = this.fb.group({
    id_account_payable: [],
    date_abono: [new Date(), [ Validators.required]],
    monto_abono: [0]
  });

  ngOnInit(): void {
    this.viewDetailsSub$ = this.accountsPayableService.detailsSubs$.subscribe(accountPayable => {
      this.accountPayable.set(accountPayable);
      this.abonoForm.get('monto_abono')?.clearValidators();
      this.abonoForm.get('monto_abono')?.addValidators([Validators.min(0),Validators.max(accountPayable.monto_restante)]);
      this.abonoForm.patchValue({
        id_account_payable: accountPayable.id,
        monto_abono:accountPayable.monto_restante,
      })
    });
  }

  newAbono() {
    this.abonoForm.markAllAsTouched();
    if(!this.abonoForm.valid) return;
    this.loading.set(true);
    this.accountsPayableService.postNewAbonoAccountPayable(this.abonoForm.value).subscribe({
      next: (resp) => {
        this.accountsPayableService.reloadAccountsPayable$.next(this.abonoForm.get('id_account_payable')?.value);
        this.loading.set(false);
        this.accountsPayableService.showModalNewAbono = false;
        //si paga todo cerramos el modal de detalle
        if(this.accountPayable()?.monto_restante == this.abonoForm.get('monto_abono')?.value) {
          this.accountsPayableService.showModalDetailsAccountPayable = false;
        }
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Abono nuevo agregado correctamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        }).then(() => this.accountsPayableService.printVoucherAbonoAccountPayablePdf(resp.abonosAccountsPayable.id));
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
      id_account_payable: this.accountPayable()!.id,
      date_abono: new Date(),
      monto_abono: this.accountPayable()!.monto_restante,
    });
  }
}
