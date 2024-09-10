import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { InputsService } from '../../../services/inputs.service';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ScalesService } from 'src/app/pages/inventories/services/scales.service';
import { Scale } from 'src/app/pages/inventories/interfaces/scale.interface';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import { NewInputForm } from '../../../interfaces/input.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-save-input',
  templateUrl: './modal-save-input.component.html',
  styles: [
  ]
})
export class ModalSaveInputComponent implements OnInit {
  inputsService     = inject( InputsService );
  bankService       = inject( BankService );
  scalesService     = inject( ScalesService );
  validatorsService = inject( ValidatorsService );
  fb                = inject( FormBuilder );
  types_pay         = signal([{name: 'EFECTIVO', code: 'EFECTIVO'},{name: 'CHEQUE', code: 'CHEQUE'},{name: 'TRANSFERENCIA', code: 'TRANSFERENCIA'}]);
  types_registry    = computed(() => this.inputsService.types_registry());
  decimalLength     = signal(this.validatorsService.decimalLength());
  decimal           = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  scalas            = signal<Scale[]>([]);
  banks             = signal<Bank[]>([]);
  blockedInputCredit= signal(false);
  loading           = signal(false);
  providerSelect    = computed(() => this.inputsService.providerSelect());
  totalSummary      = computed(() => this.inputsService.detailShopping().reduce( (sum, product) => Number(sum) + Number(product.import),0));

  formInput: UntypedFormGroup  = this.fb.group({
    id_provider: ['',[Validators.required]],
    id_scales: ['',[Validators.required]],
    id_sucursal: ['',[Validators.required]],
    id_storage: ['',[Validators.required]],
    date_voucher: [new Date(),[Validators.required]],
    registry_number: ['',[Validators.required]],
    discount: [0,[Validators.min(0),Validators.required]],
    pay_to_credit: [false,[Validators.required]], //TRUE:CREDITO  FALSE:CONTADO
    on_account: [0,[Validators.min(0), Validators.required]],
    sumas: [0,[Validators.min(0), Validators.required]],
    total: [0,[Validators.min(0), Validators.required]],
    type_payment: ['EFECTIVO',[Validators.required]],
    comments: [null,[]],
    account_input: [null,[]],
    id_bank: [null,[]],
    type_registry: ['',[Validators.required]],
    is_paid: [false,[Validators.required]], //si es con factura
    status: ['ACTIVE'],
  });

  ngOnInit(): void {
    this.getAllScalas();
    this.getAllBanks();
  }

  saveInput() {
    this.formInput.markAllAsTouched();
    this.formInput.patchValue({id_provider: this.providerSelect()?.id, id_sucursal: this.validatorsService.id_sucursal()})
    if(!this.formInput.valid) return;
    this.loading.set(true);
    const inputDetail = this.inputsService.detailShopping().map(prod=> ({
      quantity: prod.quantity,
      cost: prod.costo,
      total: prod.import,
      id_product: prod.id,
      status: "ACTIVE" 
    }));
    const data:NewInputForm = {
      input_data: this.formInput.value,
      input_details: inputDetail
    }
    this.inputsService.postNewInput(data).subscribe({
      next: (resp) => {
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Compra registrada exitosamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.inputsService.showModalSaveInput = false;
        this.inputsService.resetInput();
        if(this.inputsService._inputConfig.printAfter) {
          this.inputsService.printPdfReport(resp.id_input);
        }
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  editInput() {
    this.formInput.markAllAsTouched();
    this.formInput.patchValue({id_provider: this.providerSelect()?.id})
    if(!this.formInput.valid) return;
    this.loading.set(true);
    const inputDetail = this.inputsService.detailShopping().map(prod=> ({
      quantity: prod.quantity,
      cost: prod.costo,
      total: prod.import,
      id_product: prod.id,
      status: "ACTIVE" 
    }));
    const data:NewInputForm = {
      input_data: this.formInput.value,
      input_details: inputDetail
    }
    this.inputsService.putUpdateInput(this.inputsService.dataInputForEdit()!.id,data).subscribe({
      next: (resp) => {
        Swal.fire({ 
          title: 'Éxito!', 
          text: `Compra Modificada exitosamente`,
          icon: 'success', 
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert'},
        });
        this.inputsService.showModalSaveInput = false;
        this.inputsService.isEdit = false;
        this.inputsService.resetInput();
        if(this.inputsService._inputConfig.printAfter) {
          this.inputsService.printPdfReport(resp.id_input);
        }
      },
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  selectTypePay() {
    const type_pay = this.formInput.get('type_payment')?.value;
    this.formInput.patchValue({
      account_input: null, id_bank: null
    });
    if(type_pay != 'EFECTIVO') {
      this.formInput.get('account_input')?.setValidators([Validators.required]);
      this.formInput.get('id_bank')?.setValidators([Validators.required]);
    } else {
      this.formInput.get('account_input')?.clearValidators();
      this.formInput.get('id_bank')?.clearValidators();
    }
    this.formInput.get('account_input')?.updateValueAndValidity();
    this.formInput.get('id_bank')?.updateValueAndValidity();
  }


  getAllScalas() {
    this.scalesService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp) => this.scalas.set(resp.scales.data),
      error: () => this.scalas.set([])
    });
  }

  getAllBanks() {
    this.bankService.getAllAndSearch(1,1000,true).subscribe({
      next: (resp) => this.banks.set(resp.banks.data),
      error: () => this.banks.set([])
    });
  }


  onChangeDescuento() {
    /* This code is calculating the total value based on the values of three form inputs: 'sumas',
    'discount', and 'on_account'. */
    const sumas_total = this.formInput.get('sumas')?.value;
    const descuento = this.formInput.get('discount')?.value;
    const total = Number(sumas_total) - Number(descuento);
    this.formInput.get('total')?.setValue(total);
    /* The code is checking if the value of the 'on_account' form input is greater than the calculated 'total'
    value. If it is, then it sets the value of the 'on_account' form input to be equal to the
    'total' value. This ensures that the 'on_account' value does not exceed the total value. */
    const on_account = this.formInput.get('on_account')?.value;
    if(on_account > total) {
      this.formInput.get('on_account')?.setValue(total);
    }
  }
  
  onShowModal() {
    //default storage
    const storages = this.validatorsService.storages();
    if(storages.length == 1){
      this.formInput.patchValue({id_storage:storages[0].id});
    }
    this.formInput.patchValue({
      sumas: this.totalSummary(),
      total: this.totalSummary()
    });
    if(this.inputsService.isEdit) {
      const input_edit =  this.inputsService.dataInputForEdit();
      const on_account = input_edit?.accounts_payable?.monto_abonado;
      const abonos = input_edit?.accounts_payable?.abonosAccountsPayable;
      if(abonos && abonos.length > 1) {
        //no podemos editar el monto abonado. asi que bloquear 
        this.blockedInputCredit.set(true);  
      }
      this.formInput.patchValue({
        id_scales:input_edit?.id_scales,
        id_sucursal: input_edit?.id_sucursal,
        id_storage: input_edit?.id_storage,//new
        date_voucher: new Date(input_edit!.date_voucher),
        registry_number: input_edit?.registry_number,
        discount: input_edit?.discount,
        type_payment: input_edit?.type_payment,
        on_account:on_account ? on_account : 0,
        pay_to_credit: input_edit?.type == 'CONTADO' ? false : true,
        comments: input_edit?.comments,
        account_input: input_edit?.account_input,
        id_bank: input_edit?.id_bank,
        type_registry:input_edit?.type_registry,
        is_paid: input_edit?.is_paid == 'true'? true : false,
        status:'ACTIVE'
      });  
      //this.setStoragesBySucursal(input_edit?.id_storage);  
      this.onChangeDescuento();
    }
  }


  resetModal() {
    this.formInput.reset({
      id_provider: '',
      id_scales: '',
      id_sucursal: '',
      id_storage: '',
      date_voucher: new Date(),
      registry_number: '',
      discount: 0,
      type_payment: 'EFECTIVO',
      on_account: 0,
      sumas: 0,
      total: 0,
      pay_to_credit: false,
      comments: null,
      account_input: null,
      id_bank: null,
      type_registry:'',

      is_paid: false,
      status:'ACTIVE'
    });
  }
}
