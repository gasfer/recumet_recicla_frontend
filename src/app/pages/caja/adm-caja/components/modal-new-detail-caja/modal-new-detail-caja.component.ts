import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CajaService } from '../../../services/caja.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modal-new-detail-caja',
  templateUrl: './modal-new-detail-caja.component.html',
  styleUrls: ['./modal-new-detail-caja.component.css']
})
export class ModalNewDetailCajaComponent {

  cajaService       = inject(CajaService);
  validatorsService = inject(ValidatorsService);
  fb                = inject(FormBuilder);
  decimalLength     = signal(this.validatorsService.decimalLength());
  loading           = signal(false);

  @Output() save$ = new EventEmitter<boolean>();

  // ─── Opciones estáticas ────────────────────────────────────────────────────

  today: Date = new Date();

  tipoPagoOptions = [
    { label: 'Efectivo',        value: 'EFECTIVO' },
    { label: 'Cuenta bancaria', value: 'CUENTA_BANCARIA' }
  ];

  clasificacionGastoOptions = [
    { label: 'Insumos consumibles',          value: 'INSUMOS_CONSUMIBLES',    icon: 'fa-solid fa-boxes-stacked'      },
    { label: 'Activos fijos maquinaria',     value: 'ACTIVOS_MAQUINARIA',     icon: 'fa-solid fa-gears'              },
    { label: 'Activos fijos vehículos',      value: 'ACTIVOS_VEHICULOS',      icon: 'fa-solid fa-truck'              },
    { label: 'Muebles y equipos de oficina', value: 'MUEBLES_EQUIPOS',        icon: 'fa-solid fa-chair'              },
    { label: 'Gastos operativos',            value: 'GASTOS_OPERATIVOS',      icon: 'fa-solid fa-screwdriver-wrench' },
    { label: 'Gastos administrativos',       value: 'GASTOS_ADMINISTRATIVOS', icon: 'fa-solid fa-briefcase'          },
    { label: 'Otros gastos',                 value: 'OTROS_GASTOS',           icon: 'fa-solid fa-ellipsis'           },
  ];

  tipoComprobanteOptions = [
    { label: 'Factura',         value: 'FACTURA'           },
    { label: 'Recibo',          value: 'RECIBO'            },
    { label: 'Nota de débito',  value: 'NOTA_DEBITO'       },
    { label: 'Ticket',          value: 'TICKET'            },
    { label: 'Sin comprobante', value: 'SIN_COMPROBANTE'   },
  ];

  // ─── Opciones dinámicas (cargar desde servicio) ────────────────────────────

  cuentasBancarias: any[] = [];   // TODO: cargar en ngOnInit desde servicio
  usuariosOptions:  any[] = [];   // TODO: cargar en ngOnInit desde servicio
  archivoAdjunto:   File | null = null;

  // ─── Formulario ───────────────────────────────────────────────────────────

  form: FormGroup = this.fb.group({
    // campos originales
    type:         ['', [Validators.required]],
    id_sucursal:  [this.validatorsService.id_sucursal(), [Validators.required]],

    // pago
    type_payment:   ['EFECTIVO', [Validators.required]],
    cuentaBancaria: [null],

    // clasificación y monto
    clasificacionGasto: [null, [Validators.required]],
    monto:              ['',   [Validators.required, Validators.min(0.50), Validators.max(100000000)]],

    // fecha y responsable
    fecha:       [new Date(), [Validators.required]],
    responsable: [null,       [Validators.required]],

    // proveedor
    proveedorNombre: [''],
    proveedorNit:    [''],

    // comprobante
    tipoComprobante: ['FACTURA', [Validators.required]],
    numeroFactura:   [''],
    fechaFactura:    [null],

    // detalle
    conceptoGasto: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    description:   ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(500),
      this.validatorsService.isSpacesInDynamicTxt
    ]],

    // adjunto (solo referencia local, el archivo se maneja por separado)
    comprobante: [null],
  });

  // ─── Lógica tipo de pago ──────────────────────────────────────────────────

  get esCuentaBancaria(): boolean {
    return this.form.get('type_payment')?.value === 'CUENTA_BANCARIA';
  }

  onTipoPagoChange(event: any): void {
    if (event.value !== 'CUENTA_BANCARIA') {
      this.form.get('cuentaBancaria')?.reset();
      this.form.get('cuentaBancaria')?.clearValidators();
    } else {
      this.form.get('cuentaBancaria')?.setValidators([Validators.required]);
    }
    this.form.get('cuentaBancaria')?.updateValueAndValidity();
  }

  // ─── Archivo adjunto ──────────────────────────────────────────────────────

  onFileSelect(event: any): void {
    const file: File = event.files?.[0] ?? null;
    this.archivoAdjunto = file;
    this.form.patchValue({ comprobante: file?.name ?? null });
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────

  newDetailCaja(): void {
    this.form.patchValue({ type: this.cajaService.type_movement });
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    this.loading.set(true);

    // Si necesitas enviar archivo usa FormData, si no, envía solo el valor
    const payload = this.archivoAdjunto
      ? this.buildFormData()
      : this.form.value;

    this.cajaService.postNewDetailCaja(payload).subscribe({
      complete: () => {
        this.save$.next(true);
        this.loading.set(false);
        this.cajaService.showModalMovementCaja = false;
        Swal.fire({
          title: '¡Éxito!',
          text: `${this.cajaService.type_movement} registrado correctamente`,
          icon: 'success',
          showClass:   { popup: 'animated animate fadeInDown' },
          customClass: { container: 'swal-alert' },
        });
      },
      error: () => this.loading.set(false)
    });
  }

  /** Construye FormData cuando hay archivo adjunto */
  private buildFormData(): FormData {
    const fd = new FormData();
    Object.entries(this.form.value).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        fd.append(key, val instanceof Date ? val.toISOString() : String(val));
      }
    });
    if (this.archivoAdjunto) {
      fd.append('comprobante', this.archivoAdjunto, this.archivoAdjunto.name);
    }
    return fd;
  }

  // ─── Reset ────────────────────────────────────────────────────────────────

  resetModal(): void {
    this.archivoAdjunto = null;
    this.form.reset({
      type:               '',
      id_sucursal:        this.validatorsService.id_sucursal(),
      type_payment:       'EFECTIVO',
      cuentaBancaria:     null,
      clasificacionGasto: null,
      monto:              '',
      fecha:              new Date(),
      responsable:        null,
      proveedorNombre:    '',
      proveedorNit:       '',
      tipoComprobante:    'FACTURA',
      numeroFactura:      '',
      fechaFactura:       null,
      conceptoGasto:      '',
      description:        '',
      comprobante:        null,
    });
  }
}
