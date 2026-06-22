import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { OutputService } from '../../../services/output.service';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { ScalesService } from 'src/app/pages/inventories/services/scales.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { FormBuilder, FormGroup, UntypedFormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';
import { Scale } from 'src/app/pages/inventories/interfaces/scale.interface';
import { Bank } from 'src/app/pages/managements/interfaces/bank.interface';
import { NewOutputForm } from '../../../interfaces/output.interface';
import Swal from 'sweetalert2';
import { TransportCompanyService } from 'src/app/pages/managements/services/trasport-company.service';
import {
  CargoTruck,
  Chauffeur,
} from 'src/app/pages/managements/interfaces/trasport_company.interfaces';
import { ComponentsService } from 'src/app/core/services/components.service';

@Component({
  selector: 'app-modal-save-output',
  templateUrl: './modal-save-output.component.html',
  styles: [],
})
export class ModalSaveOutputComponent implements OnInit {
  outputService = inject(OutputService);
  bankService = inject(BankService);
  scalesService = inject(ScalesService);
  validatorsService = inject(ValidatorsService);
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  transportCompanyService = inject(TransportCompanyService);
  componentService = inject(ComponentsService);
  types_pay = signal([
    { name: 'EFECTIVO' },
    { name: 'CHEQUE' },
    { name: 'TRANSFERENCIA' },
  ]);
  types_comprobante = signal([{ name: 'FACTURA' }, { name: 'PREVENTA' }]);
  types_origin = signal([
    { name: 'RECUMET BOLIVIA SRL' },
    { name: 'PRODMETAL FUNDICION' },
    { name: 'COBOCE IRPA IRPA' },
    { name: 'FANACIM' },
    { name: 'ICE INGENIEROS' },
    { name: 'CIASA - SAN AURELIO' },
  ]);
  types_destination = signal([
    { name: 'ARICA CHILE' },
    { name: 'IQUIQUE CHILE' },
    { name: 'AREQUIPA CHILE' },
    { name: 'LIMA PERU' },
    { name: 'PIZCO PERU' },
    { name: 'COCHABAMBA' },
    { name: 'LA PAZ' },
    { name: 'SUCRE' },
    { name: 'SANTA CRUZ' },
    { name: 'ORURO' },
  ]);
  types_agencia = signal([{ name: 'IMES LTDA.' }, { name: 'NAVITRANES' }]);
  types_trans_mariti = signal([
    { name: 'MSC' },
    { name: 'CMA CGM' },
    { name: 'MAERSK' },
    { name: 'COSCOQ' },
    { name: 'GRENN PEACE' },
  ]);
  types_containers = signal([
    { name: '20 PIES' },
    { name: '40 PIES ESTANDAR' },
    { name: '40 PIES HIGH CUBE' },
  ]);
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);
  scalas = signal<Scale[]>([]);
  chauffeurs = signal<Chauffeur[]>([]);
  allCargoTrucks = signal<CargoTruck[]>([]);
  cargoTrucksSelect = signal<CargoTruck[]>([]);
  banks = signal<Bank[]>([]);
  blockedOutputCredit = signal(false);
  loading = signal(false);
  types_registry = computed(() => this.outputService.types_registry());
  clientSelect = computed(() => this.outputService.clientSelect());
  totalSummary = computed(() =>
    this.outputService
      .detailSale()
      .reduce((sum, product) => Number(sum) + Number(product.import), 0),
  );
  types_output = computed(() => this.outputService.types_output());

  @Input({ required: true }) id_sucursal: number | null = null;
  @Input({ required: true }) id_storage: number | null = null;
  formOutput: UntypedFormGroup = this.fb.group({
    output_data: this.fb.group({
      date_output: [new Date(), [Validators.required]],
      voucher: ['MENOR', [Validators.required]],
      open_truck: [false, [Validators.required]],
      id_client: [null, []],
      id_scale: [1, [Validators.required]],

      id_sucursal: ['', [Validators.required]],
      id_storage: ['', [Validators.required]],
      type_voucher: ['PREVENTA', [Validators.required]],
      type_registry: ['BOLETA', [Validators.required]],
      number_registry: [''], // solo informativo
      pay_to_credit: [false, [Validators.required]], //TRUE:CREDITO  FALSE:CONTADO
      on_account: [0, [Validators.min(0), Validators.required]],
      sub_total: [0, [Validators.min(0), Validators.required]],
      discount: [0, [Validators.min(0), Validators.required]],
      total: [0, [Validators.min(0), Validators.required]],
      type_payment: ['EFECTIVO', [Validators.required]],
      comments: [null, []],
      id_bank: [null, []],
      account_output: [null, []],
      status: ['ACTIVE'],
    }),
    output_big: this.fb.group({
      origin: ['RECUMET BOLIVIA SRL', []],
      destination: ['ARICA CHILE', []],
      chauffeur: [null, []],
      id_cargo_truck: [null, []],
      agencia: ['IMES LTDA.', []],
      trans_mariti: ['MSC', []],
      number_factura: [null, []],
      number_precinto: [null, []],
      poliza_seguro: [null, []],
      type_container: ['20 PIES', []],
      number_contenedor: [null, []],
    }),
  });

  ngOnInit(): void {
    this.getAllScales();
    this.getAllBanks();
    this.getAllTrasportCompanies();
  }
saveOutput() {
  this.formOutput.markAllAsTouched();

  // 🔹 Set datos necesarios
  this.formOutput.patchValue({
    output_data: {
      id_client: this.clientSelect()?.id ?? null,
      id_sucursal: this.id_sucursal,
      id_storage: this.id_storage,
    },
  });

  // 🔹 Validación: crédito requiere cliente
  if (
    !this.clientSelect() &&
    this.formOutput.get('output_data.pay_to_credit')!.value
  ) {
    return;
  }

  // 🔹 Obtener valores
  const typeRegistry =
    this.formOutput.get('output_data.type_registry')?.value;

  const numberRegistry =
    this.formOutput.get('output_data.number_registry')?.value;

  const numberControl =
    this.formOutput.get('output_data.number_registry');

  // 🔹 Validación MANUAL primero (ANTES del .valid)
  if (typeRegistry !== 'SIN FICHA') {
    if (!numberRegistry || !numberRegistry.toString().trim()) {
      numberControl?.setErrors({ required: true });
      numberControl?.markAsTouched();
      return;
    }
  } else {
    // ✅ Asegurar que NO tenga errores si es SIN FICHA
    numberControl?.setErrors(null);
  }

  // 🔥 Recién aquí validación global
  if (!this.formOutput.valid) return;

  this.loading.set(true);

  // 🔹 Detalle
  const outputDetail = this.outputService.detailSale().map((prod) => ({
    quantity: prod.quantity,
    cost: prod.costo,
    price: prod.price_select!,
    total: prod.import,
    id_product: prod.id,
    status: 'ACTIVE',
  }));

  const { output_data, output_big } = this.formOutput.getRawValue();

  // 🔹 SIN FICHA → eliminar número
  if (output_data.type_registry === 'SIN FICHA') {
    delete output_data.number_registry;
  }

  // 🔹 Chauffeur
  output_big.id_chauffeur = this.formOutput.get(
    'output_big.chauffeur'
  )?.value?.id;

  const data: NewOutputForm = {
    output_data,
    output_big,
    output_details: outputDetail,
  };

  this.outputService.postNewOutput(data).subscribe({
    next: (resp) => {
      Swal.fire({
        title: 'Éxito!',
        text: `Venta registrada exitosamente`,
        icon: 'success',
        showClass: { popup: 'animated animate fadeInDown' },
        customClass: { container: 'swal-alert' },
      });

      this.outputService.showModalSaveInput = false;
      this.outputService.resetOutput();

      if (
        this.outputService._outputConfig.printAfter &&
        this.canPrintAfterSave()
      ) {
        this.outputService.printPdfReport(resp.id_output);
      }

      this.componentService.clearInputSearch$.next(true);
    },
    error: () => this.loading.set(false),
    complete: () => this.loading.set(false),
  });
}

  selectTypeRegistry(value?: string) {
  const group = this.formOutput.get('output_data') as FormGroup;
  const control = group.get('number_registry');

  if (!control) return;

  const type = value ?? group.get('type_registry')?.value;

  if (type === 'SIN FICHA') {
    control.clearValidators();
    control.setErrors(null); // ✅ ESTA ES LA CLAVE
    control.setValue(null);
    control.disable();
  } else {
    control.setValidators([Validators.required]);
    control.enable();
  }

  control.updateValueAndValidity();
}

  editOutput() {
  this.formOutput.markAllAsTouched();

  // 🔹 Set datos necesarios
  this.formOutput.patchValue({
    output_data: {
      id_client: this.clientSelect()?.id ?? null,
      id_sucursal: this.id_sucursal,
      id_storage: this.id_storage,
    },
  });

  // 🔹 Validación: crédito requiere cliente
  if (
    !this.clientSelect() &&
    this.formOutput.get('output_data.pay_to_credit')!.value
  ) {
    return;
  }

  // 🔹 Obtener valores
  const typeRegistry =
    this.formOutput.get('output_data.type_registry')?.value;

  const numberRegistry =
    this.formOutput.get('output_data.number_registry')?.value;

  const numberControl =
    this.formOutput.get('output_data.number_registry');

  // 🔥 VALIDACIÓN MANUAL PRIMERO
  if (typeRegistry !== 'SIN FICHA') {
    if (!numberRegistry || !numberRegistry.toString().trim()) {
      numberControl?.setErrors({ required: true });
      numberControl?.markAsTouched();
      return;
    }
  } else {
    // ✅ limpiar errores si es SIN FICHA
    numberControl?.setErrors(null);
  }

  // 🔥 VALIDACIÓN GLOBAL DESPUÉS
  if (!this.formOutput.valid) return;

  this.loading.set(true);

  const inputDetail = this.outputService.detailSale().map((prod) => ({
    quantity: prod.quantity,
    cost: prod.costo,
    price: prod.price_select!,
    total: prod.import,
    id_product: prod.id,
    status: 'ACTIVE',
  }));

  const { output_data, output_big } = this.formOutput.getRawValue();

  // 🔹 SIN FICHA → eliminar número
  if (output_data.type_registry === 'SIN FICHA') {
    delete output_data.number_registry;
  }

  // 🔹 Chauffeur seguro (evita errores si viene null)
  output_big.id_chauffeur = this.formOutput.get(
    'output_big.chauffeur'
  )?.value?.id ?? null;

  const data: NewOutputForm = {
    output_data,
    output_big,
    output_details: inputDetail,
  };

  this.outputService
    .putUpdateOutput(this.outputService.dataOutputForEdit()!.id, data)
    .subscribe({
      next: (resp) => {
        Swal.fire({
          title: 'Éxito!',
          text: `Venta Modificada exitosamente`,
          icon: 'success',
          showClass: { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });

        this.outputService.showModalSaveInput = false;
        this.outputService.isEdit = false;
        this.outputService.resetOutput();

        if (
          this.outputService._outputConfig.printAfter &&
          this.canPrintAfterSave()
        ) {
          this.outputService.printPdfReport(resp.id_output);
        }

        this.componentService.clearInputSearch$.next(true);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
}

canPrintAfterSave(): boolean {
  const typeRegistry = this.formOutput.get('output_data.type_registry')?.value;
  const registryNumber = this.formOutput.get('output_data.number_registry')?.value;

  if (typeRegistry === 'SIN FICHA') return true;

  return !!registryNumber?.toString().trim();
}

  selectTypePay() {
    const type_pay = this.formOutput.get('output_data.type_payment')?.value;
    this.formOutput.patchValue({
      output_data: { account_output: null, id_bank: null },
    });
    if (type_pay != 'EFECTIVO') {
      this.formOutput
        .get('output_data.account_output')
        ?.setValidators([Validators.required]);
      this.formOutput
        .get('output_data.id_bank')
        ?.setValidators([Validators.required]);
    } else {
      this.formOutput.get('output_data.account_output')?.clearValidators();
      this.formOutput.get('output_data.id_bank')?.clearValidators();
    }
    this.formOutput.get('output_data.account_output')?.updateValueAndValidity();
    this.formOutput.get('output_data.id_bank')?.updateValueAndValidity();
  }

  selectTypeOutput() {
    const type_output = this.formOutput.get('output_data.voucher')?.value;
    if (type_output != 'MENOR') {
      this.formOutput
        .get('output_big.chauffeur')
        ?.setValidators([Validators.required]);
      this.formOutput
        .get('output_big.id_cargo_truck')
        ?.setValidators([Validators.required]);
    } else {
      this.formOutput.get('output_big.chauffeur')?.clearValidators();
      this.formOutput.get('output_big.id_cargo_truck')?.clearValidators();
    }
    this.formOutput.get('output_big.chauffeur')?.updateValueAndValidity();
    this.formOutput.get('output_big.id_cargo_truck')?.updateValueAndValidity();
  }

  selectCargoTrucks() {
    const { id_trasport_company } = this.formOutput.get(
      'output_big.chauffeur',
    )?.value;
    const cargoTrucksSelect = this.allCargoTrucks().filter(
      (cargoTrucks) => cargoTrucks.id_trasport_company == id_trasport_company,
    );
    this.cargoTrucksSelect.set(cargoTrucksSelect);
  }

  getAllScales() {
    this.scalesService.getAllAndSearch(1, 1000, true).subscribe({
      next: (resp) => this.scalas.set(resp.scales.data),
      error: () => this.scalas.set([]),
    });
  }

  getAllTrasportCompanies() {
    this.transportCompanyService.getAllAndSearch(1, 1000, true).subscribe({
      next: (resp) => {
        resp.trasport_company.data.forEach((trasport) => {
          trasport.chauffeurs.forEach((chauffeur) => {
            const chauffeur_new = {
              ...chauffeur,
              name: `${chauffeur.full_names} - ${trasport.name}`,
            };
            this.chauffeurs.update((chauffeurs) => [
              ...chauffeurs,
              chauffeur_new,
            ]);
          });
          this.allCargoTrucks.update((cargoTrucks) => [
            ...cargoTrucks,
            ...trasport.cargo_trucks,
          ]);
        });
      },
      error: () => {
        this.chauffeurs.set([]);
        this.allCargoTrucks.set([]);
        this.cargoTrucksSelect.set([]);
      },
    });
  }

  getAllBanks() {
    this.bankService.getAllAndSearch(1, 1000, true).subscribe({
      next: (resp) => this.banks.set(resp.banks.data),
      error: () => this.banks.set([]),
    });
  }

  onChangeDescuento() {
    /* This code is calculating the total value based on the values of three form inputs: 'sub_total',
    'discount', and 'on_account'. */
    const sumas_total = this.formOutput.get('output_data.sub_total')?.value;
    const descuento = this.formOutput.get('output_data.discount')?.value;
    const total = Number(sumas_total) - Number(descuento);
    this.formOutput.get('output_data.total')?.setValue(total);
    /* The code is checking if the value of the 'on_account' form input is greater than the calculated 'total'
    value. If it is, then it sets the value of the 'on_account' form input to be equal to the
    'total' value. This ensures that the 'on_account' value does not exceed the total value. */
    const on_account = this.formOutput.get('output_data.on_account')?.value;
    if (on_account > total) {
      this.formOutput.get('output_data.on_account')?.setValue(total);
    }
  }

  onShowModal() {
    this.formOutput.patchValue({
      output_data: {
        sub_total: this.totalSummary(),
        total: this.totalSummary(),
      },
    });


    if (this.outputService.isEdit) {
      const output_edit = this.outputService.dataOutputForEdit();
      const on_account = output_edit?.accounts_receivable?.monto_abonado ?? 0;
      const abonos = output_edit?.accounts_receivable?.abonosAccountsReceivable;
      if (abonos && abonos.length > 1) {
        //no podemos editar el monto abonado. asi que bloquear
        this.blockedOutputCredit.set(true);
      }
      const { trasport_company, ...chauffeur } =
        output_edit?.outputBig?.chauffeur || {};
      this.formOutput.patchValue({
        output_data: {
          voucher: output_edit?.voucher,
          open_truck: output_edit?.outputBig?.poliza_seguro ? true : false,
          id_client: output_edit?.id_client,
          date_output: new Date(output_edit!.date_output),
          id_scale: output_edit?.id_scale,
          id_sucursal: output_edit?.id_sucursal,
          id_storage: output_edit?.id_storage,
          type_voucher: output_edit?.type_voucher,
          type_registry: output_edit?.type_registry,
          number_registry: output_edit?.number_registry,
          pay_to_credit: output_edit?.type_output == 'CONTADO' ? false : true, //TRUE:CREDITO  FALSE:CONTADO
          on_account: on_account,
          //sub_total: output_edit?.sub_total,
          discount: output_edit?.discount,
          //total: output_edit?.total,
          type_payment: output_edit?.type_payment,
          comments: output_edit?.comments,
          id_bank: output_edit?.id_bank,
          account_output: output_edit?.account_output,
          status: output_edit?.status,
        },
        output_big: {
          origin: output_edit?.outputBig?.origin,
          destination: output_edit?.outputBig?.destination,
          chauffeur: {
            ...chauffeur,
            name: `${output_edit?.outputBig?.chauffeur?.full_names} - ${output_edit?.outputBig?.chauffeur?.trasport_company?.name}`,
          },
          agencia: output_edit?.outputBig?.agencia,
          trans_mariti: output_edit?.outputBig?.trans_mariti,
          number_factura: output_edit?.outputBig?.number_factura,
          number_precinto: output_edit?.outputBig?.number_precinto,
          poliza_seguro: output_edit?.outputBig?.poliza_seguro,
          type_container: output_edit?.outputBig?.type_container,
          number_contenedor: output_edit?.outputBig?.number_contenedor,
        },
      });
      this.selectCargoTrucks();
      this.formOutput
        .get('output_big.id_cargo_truck')
        ?.setValue(output_edit?.outputBig?.id_cargo_truck);
      this.onChangeDescuento();
      this.selectTypeRegistry();
    }
  }

  resetModal() {
    this.formOutput.patchValue({
      output_data: {
        voucher: 'MENOR',
        open_truck: false,
        id_client: null,
        id_scale: 1,
        id_sucursal: '',
        id_storage: '',
        type_voucher: '',
        type_registry: 'BOLETA',
        number_registry: '',
        pay_to_credit: false,
        on_account: 0,
        date_output: new Date(),
        sub_total: 0,
        discount: 0,
        total: 0,
        type_payment: 'EFECTIVO',
        comments: null,
        id_bank: null,
        account_output: null,
        status: 'ACTIVE',

      },
      output_big: {
        origin: 'RECUMET BOLIVIA SRL',
        destination: 'ARICA CHILE',
        chauffeur: null,
        id_cargo_truck: null,
        agencia: 'IMES LTDA.',
        trans_mariti: 'MSC',
        number_factura: null,
        number_precinto: null,
        poliza_seguro: null,
        type_container: '20 PIES',
        number_contenedor: null,
      },
    });
  // ✅ Habilitar nuevamente por defecto
this.formOutput.get('output_data.number_registry')?.enable();

this.selectTypeRegistry(
  this.formOutput.get('output_data.type_registry')?.value
);
  }



}
