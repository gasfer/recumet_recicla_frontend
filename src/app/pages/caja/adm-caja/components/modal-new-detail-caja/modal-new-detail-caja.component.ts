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

  // ─── Fecha máxima ──────────────────────────────────────────────────────────
  today: Date = new Date();

  // ─── Opciones de pago ──────────────────────────────────────────────────────
  tipoPagoOptions = [
    { label: 'Efectivo',        value: 'EFECTIVO'        },
    { label: 'Cuenta bancaria', value: 'CUENTA_BANCARIA' },
  ];

  // ─── Tipo registro ─────────────────────────────────────────────────────────
  tipoRegistroOptions = [
    { label: 'Gasto',  value: 'GASTO'  },
    { label: 'Activo', value: 'ACTIVO' },
  ];

  // ─── Catálogo de clasificaciones ───────────────────────────────────────────
  clasificacionOptions = [
    { label: 'Insumos consumibles',      value: 'INSUMOS_CONSUMIBLES',  tipoRegistro: 'GASTO'  },
    { label: 'Lubricantes y aceites',    value: 'LUBRICANTES',          tipoRegistro: 'GASTO'  },
    { label: 'Repuestos vehículos',      value: 'REPUESTOS_VEHICULOS',  tipoRegistro: 'GASTO'  },
    { label: 'Repuestos maquinaria',     value: 'REPUESTOS_MAQUINARIA', tipoRegistro: 'GASTO'  },
    { label: 'Mantenimiento preventivo', value: 'MANT_PREVENTIVO',      tipoRegistro: 'GASTO'  },
    { label: 'Mantenimiento correctivo', value: 'MANT_CORRECTIVO',      tipoRegistro: 'GASTO'  },
    { label: 'Servicios técnicos ext.',  value: 'SERV_TECNICOS',        tipoRegistro: 'GASTO'  },
    { label: 'Servicios básicos',        value: 'SERVICIOS_BASICOS',    tipoRegistro: 'GASTO'  },
    { label: 'Gastos administrativos',   value: 'GASTOS_ADMIN',         tipoRegistro: 'GASTO'  },
    { label: 'Refrigerios',              value: 'REFRIGERIOS',          tipoRegistro: 'GASTO'  },
    { label: 'Viáticos y transporte',    value: 'VIATICOS',             tipoRegistro: 'GASTO'  },
    { label: 'Otros gastos operativos',  value: 'OTROS_GASTOS',         tipoRegistro: 'GASTO'  },
    { label: 'Compra maquinaria',        value: 'COMPRA_MAQUINARIA',    tipoRegistro: 'ACTIVO' },
    { label: 'Compra vehículo',          value: 'COMPRA_VEHICULO',      tipoRegistro: 'ACTIVO' },
    { label: 'Herramientas',             value: 'HERRAMIENTAS',         tipoRegistro: 'ACTIVO' },
    { label: 'Muebles y equipos',        value: 'MUEBLES_EQUIPOS',      tipoRegistro: 'ACTIVO' },
  ];

  // ─── Tipo de uso (lubricantes) ─────────────────────────────────────────────
  tipoUsoOptions = [
    { label: 'Vehículo',   value: 'VEHICULO'   },
    { label: 'Maquinaria', value: 'MAQUINARIA' },
    { label: 'General',    value: 'GENERAL'    },
  ];

  // ─── Área solicitante (insumos consumibles) ────────────────────────────────
  areaSolicitanteOptions = [
    { label: 'Producción Aluminio', value: 'PROD_ALUMINIO'   },
    { label: 'Producción Cobre',    value: 'PROD_COBRE'      },
    { label: 'Producción RAEES',    value: 'PROD_RAEES'      },
    { label: 'Chatarra Fierro',     value: 'CHATARRA_FIERRO' },
    { label: 'Uso Recumet',         value: 'USO_RECUMET'     },
  ];

  // ─── Lista de vehículos ────────────────────────────────────────────────────
  vehiculosOptions = [
    { id: 'VH1', nombre: 'Vehículo 1',    tipo: 'VEHICULO', icono: 'fa-car'           },
    { id: 'VH2', nombre: 'Vehículo 2',    tipo: 'VEHICULO', icono: 'fa-car'           },
    { id: 'VH3', nombre: 'Vehículo 3',    tipo: 'VEHICULO', icono: 'fa-car'           },
    { id: 'VH4', nombre: 'Vehículo 4',    tipo: 'VEHICULO', icono: 'fa-car'           },
    { id: 'VH5', nombre: 'Vehículo 5',    tipo: 'VEHICULO', icono: 'fa-car'           },
    { id: 'GR1', nombre: 'Grúa 1',        tipo: 'VEHICULO', icono: 'fa-truck-moving'  },
    { id: 'GR2', nombre: 'Grúa 2',        tipo: 'VEHICULO', icono: 'fa-truck-moving'  },
    { id: 'MC1', nombre: 'Montacargas 1', tipo: 'VEHICULO', icono: 'fa-truck-ramp-box'},
    { id: 'MC2', nombre: 'Montacargas 2', tipo: 'VEHICULO', icono: 'fa-truck-ramp-box'},
  ];

  // ─── Lista de maquinaria ───────────────────────────────────────────────────
  maquinariasOptions = [
    { id: 'MQ1', nombre: 'Enfardadora UBC',      tipo: 'MAQUINARIA', icono: 'fa-gears' },
    { id: 'MQ2', nombre: 'Enfardadora Perfil',   tipo: 'MAQUINARIA', icono: 'fa-gears' },
    { id: 'MQ3', nombre: 'Enfardadora Plásticos',tipo: 'MAQUINARIA', icono: 'fa-gears' },
  ];


  usuariosOptions   = [
    { label: 'responsable 1', value: 'PROD_ALUMINIO'   },
    { label: 'responsable 2',    value: 'PROD_COBRE'      },
    { label: 'responsable 3',    value: 'PROD_RAEES'      },
    { label: 'responsable 4',     value: 'CHATARRA_FIERRO' },
    { label: 'responsable 5',         value: 'USO_RECUMET'     },
  ];

  /**
   * Lista unificada vehículos + maquinaria para mantenimiento.
   * Se usa en MANT_PREVENTIVO y MANT_CORRECTIVO.
   * Incluye un separador visual mediante la propiedad `separador`.
   */
  get equipoUnificadoOptions(): any[] {
    return [
      { id: '_SEP_VH', nombre: '── Vehículos ──',  tipo: 'SEPARADOR', disabled: true  },
      ...this.vehiculosOptions,
      { id: '_SEP_MQ', nombre: '── Maquinaria ──', tipo: 'SEPARADOR', disabled: true  },
      ...this.maquinariasOptions,
    ];
  }

  // ─── Tipo comprobante ──────────────────────────────────────────────────────
  tipoComprobanteOptions = [
    { label: 'Factura',         value: 'FACTURA'         },
    { label: 'Recibo',          value: 'RECIBO'          },
    { label: 'Nota de débito',  value: 'NOTA_DEBITO'     },
    { label: 'Ticket',          value: 'TICKET'          },
    { label: 'Sin comprobante', value: 'SIN_COMPROBANTE' },
  ];

  // ─── Opciones dinámicas ────────────────────────────────────────────────────
  clasificacionGastoOptions: any[] = [];
  cuentasBancarias:          any[] = [];   // TODO: cargar desde servicio
  //usuariosOptions:           any[] = [];   // TODO: cargar desde servicio
  archivoAdjunto:            File | null = null;

  // ─── Formulario ───────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    type:        ['', [Validators.required]],
    id_sucursal: [this.validatorsService.id_sucursal(), [Validators.required]],

    // pago
    type_payment:   ['EFECTIVO', [Validators.required]],
    cuentaBancaria: [null],

    // clasificación
    tipoRegistro:       [null, [Validators.required]],
    clasificacionGasto: [null, [Validators.required]],

    // condicionales de clasificación
    tipoUso:         [null],   // LUBRICANTES
    areaSolicitante: [null],   // INSUMOS_CONSUMIBLES
    vehiculo:        [null],   // REPUESTOS_VEHICULOS
    maquinaria:      [null],   // REPUESTOS_MAQUINARIA
    equipoAsignado:  [null],   // MANT_PREVENTIVO | MANT_CORRECTIVO (lista unificada)

    // monto
    monto: ['', [Validators.required, Validators.min(0.50), Validators.max(100000000)]],

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
      this.validatorsService.isSpacesInDynamicTxt,
    ]],

    comprobante: [null],
  });

  // ─── Getters de visibilidad ────────────────────────────────────────────────

  get esCuentaBancaria(): boolean {
    return this.form.get('type_payment')?.value === 'CUENTA_BANCARIA';
  }

  get esLubricante(): boolean {
    return this.form.get('clasificacionGasto')?.value === 'LUBRICANTES';
  }

  get esInsumosConsumibles(): boolean {
    return this.form.get('clasificacionGasto')?.value === 'INSUMOS_CONSUMIBLES';
  }

  /** Solo lista de vehículos (repuestos exclusivos de vehículo) */
  get soloVehiculo(): boolean {
    return this.form.get('clasificacionGasto')?.value === 'REPUESTOS_VEHICULOS';
  }

  /** Solo lista de maquinaria (repuestos exclusivos de maquinaria) */
  get soloMaquinaria(): boolean {
    return this.form.get('clasificacionGasto')?.value === 'REPUESTOS_MAQUINARIA';
  }

  /** Lista unificada: mantenimiento preventivo O correctivo */
  get esMantenimiento(): boolean {
    const v = this.form.get('clasificacionGasto')?.value;
    return v === 'MANT_PREVENTIVO' || v === 'MANT_CORRECTIVO';
  }

  // ─── Lógica tipo de pago ──────────────────────────────────────────────────
  onTipoPagoChange(event: any): void {
    const ctrl = this.form.get('cuentaBancaria')!;
    if (event.value === 'CUENTA_BANCARIA') {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.reset();
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  // ─── Lógica tipo registro → filtra clasificación ──────────────────────────
  onTipoRegistroChange(event: any): void {
    this.clasificacionGastoOptions = this.clasificacionOptions.filter(
      c => c.tipoRegistro === event.value
    );
    this.form.patchValue({ clasificacionGasto: null });
    this._resetCondicionales();
  }

  // ─── Lógica clasificación → activa campos dependientes ────────────────────
  onClasificacionChange(event: any): void {
    this._resetCondicionales();

    switch (event.value as string) {
      case 'LUBRICANTES':
        this._setRequired('tipoUso');
        break;
      case 'INSUMOS_CONSUMIBLES':
        this._setRequired('areaSolicitante');
        break;
      case 'REPUESTOS_VEHICULOS':
        this._setRequired('vehiculo');
        break;
      case 'REPUESTOS_MAQUINARIA':
        this._setRequired('maquinaria');
        break;
      case 'MANT_PREVENTIVO':
      case 'MANT_CORRECTIVO':
        this._setRequired('equipoAsignado');
        break;
    }
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────
  private _setRequired(controlName: string): void {
    const ctrl = this.form.get(controlName)!;
    ctrl.setValidators([Validators.required]);
    ctrl.updateValueAndValidity();
  }

  private _resetCondicionales(): void {
    ['tipoUso', 'areaSolicitante', 'vehiculo', 'maquinaria', 'equipoAsignado'].forEach(name => {
      const ctrl = this.form.get(name)!;
      ctrl.reset();
      ctrl.clearValidators();
      ctrl.updateValueAndValidity();
    });
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
      error: () => this.loading.set(false),
    });
  }

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
    this.archivoAdjunto            = null;
    this.clasificacionGastoOptions = [];

    this.form.reset({
      type:               '',
      id_sucursal:        this.validatorsService.id_sucursal(),
      type_payment:       'EFECTIVO',
      cuentaBancaria:     null,
      tipoRegistro:       null,
      clasificacionGasto: null,
      tipoUso:            null,
      areaSolicitante:    null,
      vehiculo:           null,
      maquinaria:         null,
      equipoAsignado:     null,
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

    this.form.get('cuentaBancaria')!.clearValidators();
    this.form.get('cuentaBancaria')!.updateValueAndValidity();
    this._resetCondicionales();
  }
}
