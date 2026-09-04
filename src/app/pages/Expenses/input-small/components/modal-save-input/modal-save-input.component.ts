import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InputsService } from '../../../services/inputs.service';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ScalesService } from 'src/app/pages/inventories/services/scales.service';
import { Scale } from 'src/app/pages/inventories/interfaces/scale.interface';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import { NewInputForm } from '../../../interfaces/input.interface';
import Swal from 'sweetalert2';
import { ComponentsService } from 'src/app/core/services/components.service';
import { PurchaseTraceabilityApiService } from 'src/app/core/services/purchase-traceability-api.service';
import { Router } from '@angular/router';
import { isPurchaseEditPermissionDenied } from 'src/app/core/utils/purchase-edit-access';
import {
  INITIAL_PRICING_GRACE_HOURS,
  isPurchaseEditAuthorizationRequired,
  purchaseEditAuthorizationMessage,
  resolvePurchasePricingDecision,
} from 'src/app/core/utils/purchase-pricing-authorization';

@Component({
  selector: 'app-modal-save-input',
  templateUrl: './modal-save-input.component.html',
  styles: [],
})
export class ModalSaveInputComponent implements OnInit {
  readonly pricingGraceHours = INITIAL_PRICING_GRACE_HOURS;
  inputsService = inject(InputsService);
  bankService = inject(BankService);
  scalesService = inject(ScalesService);
  validatorsService = inject(ValidatorsService);
  componentService = inject(ComponentsService);
  fb = inject(FormBuilder);
  private authorizationApi = inject(PurchaseTraceabilityApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private policyRefreshEnabled = false;
  private authorizersLoaded = false;
  private serverRequiresAuthorization = false;
  authorizers = signal<{ id: number; label: string }[]>([]);
  loadingAuthorizers = signal(false);
  authorizersError = signal('');
  editAuthorizationRequired = signal(false);
  types_pay = signal([
    { name: 'EFECTIVO', code: 'EFECTIVO' },
    { name: 'CHEQUE', code: 'CHEQUE' },
    { name: 'TRANSFERENCIA', code: 'TRANSFERENCIA' },
  ]);
  types_registry = computed(() => this.inputsService.types_registry());
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  scalas = signal<Scale[]>([]);
  banks = signal<Bank[]>([]);
  blockedInputCredit = signal(false);
  loading = signal(false);
  providerSelect = computed(() => this.inputsService.providerSelect());
  totalSummary = computed(() =>
    this.inputsService
      .detailShopping()
      .reduce((sum, product) => Number(sum) + Number(product.import), 0),
  );
  @Input({ required: true }) id_storage: number | null = null;

  referral_sources = computed(this.inputsService.referral_sources);

  formInput: UntypedFormGroup = this.fb.group({
    id_provider: ['', [Validators.required]],
    id_scales: [1, [Validators.required]],
    id_sucursal: ['', [Validators.required]],
    id_storage: ['', [Validators.required]],
    date_voucher: [new Date(), [Validators.required]],
    registry_number: [''], // solo informativo
    discount: [0, [Validators.min(0), Validators.required]],
    pay_to_credit: [true, [Validators.required]], //TRUE:CREDITO  FALSE:CONTADO
    on_account: [0, [Validators.min(0), Validators.required]],
    sumas: [0, [Validators.min(0), Validators.required]],
    total: [0, [Validators.min(0), Validators.required]],
    type_payment: ['EFECTIVO', [Validators.required]],
    comments: [null, []],
    account_input: [null, []],
    id_bank: [null, []],
    type_registry: ['BOLETA', [Validators.required]],
    is_paid: [false, [Validators.required]], //si es con factura
    status: ['ACTIVE'],
    referral_sources: ['', [Validators.required]],
    old_customer: [false],
    with_pickup: [false],
    audit_reason: ['', [Validators.minLength(5)]],
    id_authorizer_user: [null],
  });

  ngOnInit(): void {
    this.getAllScalas();
    this.getAllBanks();
    this.onOldCustomerChange();
    this.formInput.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.policyRefreshEnabled && this.inputsService.isEdit) {
          this.refreshEditAuthorizationPolicy();
        }
      });
  }

  saveInput() {
    this.formInput.patchValue({
      id_provider: this.providerSelect()?.id,
      id_sucursal: this.validatorsService.id_sucursal(),
      id_storage: this.id_storage,
    });

    this.formInput.markAllAsTouched();
    if (!this.formInput.valid) return;

    this.loading.set(true);

    const inputDetail = this.inputsService.detailShopping().map((prod) => ({
      quantity: prod.quantity,
      cost: prod.costo,
      total: prod.import,
      id_product: prod.id,
      status: 'ACTIVE',
    }));

    // ✅ Usar getRawValue() para incluir campos deshabilitados
    const inputData = { ...this.formInput.getRawValue() };

    // ✅ Solo eliminar registry_number si es SIN FICHA (el backend lo genera)
    if (inputData.type_registry === 'SIN FICHA') {
      delete inputData.registry_number;
    }

    const data: NewInputForm = {
      input_data: inputData,
      input_details: inputDetail,
    };

    this.inputsService.postNewInput(data).subscribe({
      next: (resp) => {
        this.inputsService.showModalSaveInput = false;
        this.inputsService.isEdit = false;
        this.inputsService.resetInput();
        this.componentService.clearInputSearch$.next(true);

        Swal.fire({
          title: 'Éxito!',
          text: `Compra Registrada exitosamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
        if (
          this.inputsService._inputConfig.printAfter &&
          this.canPrintAfterSave()
        ) {
          this.inputsService.printPdfReport(resp.id_input);
        }
      },
      complete: () => this.loading.set(false),
      error: (err) => this.loading.set(false),
    });
  }
  editInput() {
    this.formInput.patchValue({
      id_provider: this.providerSelect()?.id,
      id_storage: this.id_storage,
    }, { emitEvent: false });
    this.refreshEditAuthorizationPolicy();
    if (this.editAuthorizationRequired()) {
      const authorization = this.formInput.get('id_authorizer_user');
      if (!authorization?.value) {
        authorization?.setErrors({ required: true });
        authorization?.markAsTouched();
        return;
      }
      const auditReason = String(this.formInput.get('audit_reason')?.value || '').trim();
      if (auditReason.length < 5) {
        this.formInput.get('audit_reason')?.setErrors({ minlength: true });
        this.formInput.get('audit_reason')?.markAsTouched();
        Swal.fire('Motivo requerido', 'Explique en al menos 5 caracteres por qué se modifica la compra.', 'warning');
        return;
      }
    }
    this.formInput.markAllAsTouched();
    if (!this.formInput.valid) return;
    this.loading.set(true);
    const inputDetail = this.inputsService.detailShopping().map((prod) => ({
      quantity: prod.quantity,
      cost: prod.costo,
      total: prod.import,
      id_product: prod.id,
      status: 'ACTIVE',
    }));
    const inputData = { ...this.formInput.getRawValue() };
    if (inputData.type_registry === 'SIN FICHA') {
      delete inputData.registry_number;
    }

    const data: NewInputForm = {
      input_data: inputData,
      input_details: inputDetail,
    };

    this.inputsService
      .putUpdateInput(this.inputsService.dataInputForEdit()!.id, data)
      .subscribe({
        next: (resp) => {
          this.inputsService.showModalSaveInput = false;
          this.inputsService.isEdit = false;
          this.inputsService.resetInput();
          this.componentService.clearInputSearch$.next(true);
          Swal.fire({
            title: 'Éxito!',
            text: `Compra Modificada exitosamente`,
            icon: 'success',
            showClass: { popup: 'animated animate fadeInDown' },
            customClass: { container: 'swal-alert' },
          });
          if (
            this.inputsService._inputConfig.printAfter &&
            this.canPrintAfterSave()
          ) {
            this.inputsService.printPdfReport(resp.id_input);
          }
        },
        complete: () => this.loading.set(false),
        error: (error) => {
          this.loading.set(false);
          if (isPurchaseEditAuthorizationRequired(error)) {
            this.handlePurchaseEditAuthorizationError(error);
          }
        },
      });
  }

  canPrintAfterSave(): boolean {
    const typeRegistry = this.formInput.get('type_registry')?.value;
    const registryNumber = this.formInput.get('registry_number')?.value;

    // SIN FICHA → backend genera número → sí se puede imprimir
    if (typeRegistry === 'SIN FICHA') return true;

    // BOLETA / FICHA → requiere número válido
    return !!registryNumber;
  }

  selectTypePay() {
    const type_pay = this.formInput.get('type_payment')?.value;
    this.formInput.patchValue({
      account_input: null,
      id_bank: null,
    });
    if (type_pay != 'EFECTIVO') {
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
    this.scalesService.getAllAndSearch(1, 10000, true).subscribe({
      next: (resp) => this.scalas.set(resp.scales.data),
      error: () => this.scalas.set([]),
    });
  }

  getAllBanks() {
    this.bankService.getAllAndSearch(1, 10000, true).subscribe({
      next: (resp) => this.banks.set(resp.banks.data),
      error: () => this.banks.set([]),
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
    if (on_account > total) {
      this.formInput.get('on_account')?.setValue(total);
    }
  }

  onShowModal() {
    Swal.close();
    this.policyRefreshEnabled = false;
    this.formInput.patchValue({
      sumas: this.totalSummary(),
      total: this.totalSummary(),
    });
    this.selectTypeRegistry();
    if (this.inputsService.isEdit) {
      const input_edit = this.inputsService.dataInputForEdit();
      const on_account = input_edit?.accounts_payable?.monto_abonado;
      const abonos = input_edit?.accounts_payable?.abonosAccountsPayable;
      if (abonos && abonos.length > 1) {
        //no podemos editar el monto abonado. asi que bloquear
        this.blockedInputCredit.set(true);
      }
      this.formInput.patchValue({
        id_scales: input_edit?.id_scales,
        id_sucursal: input_edit?.id_sucursal,
        id_storage: input_edit?.id_storage, //new
        date_voucher: new Date(input_edit!.date_voucher),
        registry_number: input_edit?.registry_number,
        discount: input_edit?.discount,
        type_payment: input_edit?.type_payment,
        on_account: on_account ? on_account : 0,
        pay_to_credit: input_edit?.type == 'CONTADO' ? false : true,
        comments: input_edit?.comments,
        account_input: input_edit?.account_input,
        id_bank: input_edit?.id_bank,
        type_registry: input_edit?.type_registry,
        is_paid: input_edit?.is_paid == 'true' ? true : false,
        status: 'ACTIVE',
        referral_sources: input_edit?.referral_sources,
        old_customer: input_edit?.old_customer,
        with_pickup: input_edit?.with_pickup,
      });
      //this.setStoragesBySucursal(input_edit?.id_storage);
      this.onChangeDescuento();
      this.onOldCustomerChange();
    }
    this.policyRefreshEnabled = true;
    this.refreshEditAuthorizationPolicy();
  }

  selectTypeRegistry() {
    const typeRegistry = this.formInput.get('type_registry')?.value;
    this.formInput.patchValue({ registry_number: '' });

    if (typeRegistry === 'SIN FICHA') {
      // ✅ El backend genera el número → deshabilitar (no es necesario ingresarlo)
      this.formInput.get('registry_number')?.disable();
    } else {
      // ✅ FICHA o BOLETA → el usuario debe ingresarlo
      this.formInput.get('registry_number')?.enable();
    }
  }
  resetModal() {
    this.policyRefreshEnabled = false;
    this.serverRequiresAuthorization = false;
    this.authorizersLoaded = false;
    this.editAuthorizationRequired.set(false);
    this.authorizers.set([]);
    this.authorizersError.set('');
    this.formInput.reset({
      id_provider: '',
      id_scales: 1,
      id_sucursal: '',
      id_storage: '',
      date_voucher: new Date(),
      registry_number: '',
      discount: 0,
      type_payment: 'EFECTIVO',
      on_account: 0,
      sumas: 0,
      total: 0,
      pay_to_credit: true,
      comments: null,
      account_input: null,
      id_bank: null,
      type_registry: 'BOLETA',
      is_paid: false,
      status: 'ACTIVE',
      referral_sources: '',
      old_customer: false,
      with_pickup: false,
      audit_reason: '',
      id_authorizer_user: null,
    });

    // ✅ BOLETA por defecto → habilitar registry_number
    this.formInput.get('registry_number')?.enable();

    this.blockedInputCredit.set(false);

    setTimeout(() => {
      this.onOldCustomerChange();
      this.selectTypePay();
    });
  }

  onOldCustomerChange(): void {
    const isOldCustomer = this.formInput.get('old_customer')?.value;
    const referralSourcesControl = this.formInput.get('referral_sources');

    if (isOldCustomer) {
      referralSourcesControl?.clearValidators();
      referralSourcesControl?.setValue('');
    } else {
      referralSourcesControl?.setValidators([Validators.required]);
    }
    referralSourcesControl?.updateValueAndValidity();
  }

  refreshEditAuthorizationPolicy(): void {
    if (!this.inputsService.isEdit) {
      this.configureAuthorizationFields(false);
      return;
    }
    const currentInput = {
      ...this.formInput.getRawValue(),
      id_provider: this.providerSelect()?.id,
      id_storage: this.id_storage ?? this.formInput.get('id_storage')?.value,
    };
    const decision = resolvePurchasePricingDecision(
      this.inputsService.dataInputForEdit(),
      currentInput,
      this.inputsService.detailShopping(),
    );
    const required = this.serverRequiresAuthorization || decision.requiresAuthorization;
    this.configureAuthorizationFields(required);
    if (required) this.loadAuthorizers();
  }

  private configureAuthorizationFields(required: boolean): void {
    this.editAuthorizationRequired.set(required);
    const reason = this.formInput.get('audit_reason');
    const authorization = this.formInput.get('id_authorizer_user');
    reason?.setValidators(required ? [Validators.required, Validators.minLength(5)] : []);
    authorization?.setValidators(required ? [Validators.required] : []);
    if (!required) {
      reason?.setValue('', { emitEvent: false });
      authorization?.setValue(null, { emitEvent: false });
    }
    reason?.updateValueAndValidity({ emitEvent: false });
    authorization?.updateValueAndValidity({ emitEvent: false });
  }

  handlePurchaseEditAuthorizationError(error: unknown): void {
    this.serverRequiresAuthorization = true;
    this.configureAuthorizationFields(true);
    this.loadAuthorizers();
    void Swal.fire({
      title: 'Autorización requerida',
      text: purchaseEditAuthorizationMessage(error),
      icon: 'warning',
      customClass: { container: 'swal-alert' },
    });
  }

  loadAuthorizers(): void {
    if (this.authorizersLoaded || this.loadingAuthorizers()) return;
    this.loadingAuthorizers.set(true);
    this.authorizersError.set('');
    this.authorizers.set([]);
    this.authorizationApi.getAuthorizers().subscribe({
      next: ({ users }) => {
        this.authorizersLoaded = true;
        this.authorizers.set(users.map(user => ({
          id: user.id, label: user.full_names + ' · ' + (user.role === 'ADMINISTRADOR' ? 'Administrador' : 'Encargado')
        })));
        if (!users.length) this.authorizersError.set('No hay administradores o encargados activos disponibles.');
        this.loadingAuthorizers.set(false);
      },
      error: (error) => {
        this.authorizersLoaded = false;
        if (isPurchaseEditPermissionDenied(error)) {
          this.loadingAuthorizers.set(false);
          this.inputsService.showModalSaveInput = false;
          this.inputsService.isEdit = false;
          this.inputsService.resetInput();
          void this.router.navigateByUrl('/inputs/query-inputs');
          return;
        }
        this.authorizersError.set('No se pudo cargar la lista de responsables. Intente nuevamente.');
        this.loadingAuthorizers.set(false);
      }
    });
  }
}
