import {
  Component, OnInit, OnDestroy,
  signal, computed, inject
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TruckScaleReaderService, TruckWeighingRecord } from '../services/truck-scale-reader.service';
import { environment } from 'src/environments/environment';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface Proveedor {
  id        : number;
  ciNit     : string;
  nombre    : string;
}

export interface Transportista {
  id        : number;
  ci        : string;
  nombre    : string;
  placa     : string;
  marca     : string;
  color     : string;
  tipoCamion: string;
}

export interface Producto {
  id    : number;
  nombre: string;
  unidad: string;
}

export interface PesajeCamionera {
  id              : number;
  nroBoleta       : string;          // BALC-CBBA-00001
  fechaRegistro   : Date;
  horaPrimerPeso  : string;          // HH:mm:ss
  horaSegundoPeso?: string;
  tara            : number;          // peso tara (camión lleno)
  bruto           : number;          // peso bruto (camión vacío)
  neto            : number;          // tara - bruto
  proveedorOrigen : Proveedor;
  proveedorDestino: Proveedor;
  transportista   : Transportista;
  producto        : Producto;
  esServicio      : boolean;
  precioServicio? : number;
  estado          : 'PRIMER_PESO' | 'COMPLETO' | 'ANULADO';
  observacion?    : string;
}

export type ModoDialog = 'PRIMER_PESO' | 'SEGUNDO_PESO' | 'VER' | 'EDITAR';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_PROVEEDORES: Proveedor[] = [
  { id: 1, ciNit: '12345678',  nombre: 'Agro Norte S.R.L.'   },
  { id: 2, ciNit: '87654321',  nombre: 'Granos del Sur'       },
  { id: 3, ciNit: '11223344',  nombre: 'Hacienda El Monte'    },
  { id: 4, ciNit: '44332211',  nombre: 'Recicladora Andina'   },
  { id: 5, ciNit: '55667788',  nombre: 'Metales Cochabamba'   },
];

const MOCK_TRANSPORTISTAS: Transportista[] = [
  { id: 1, ci: '7654321', nombre: 'Juan Pérez',    placa: 'ABC-123', marca: 'Toyota',      color: 'Blanco',  tipoCamion: 'Camión Plato'   },
  { id: 2, ci: '8765432', nombre: 'Carlos Mamani', placa: 'XYZ-789', marca: 'Mercedes',    color: 'Rojo',    tipoCamion: 'Camión Cisterna' },
  { id: 3, ci: '9876543', nombre: 'Luis Quispe',   placa: 'DEF-456', marca: 'Scania',      color: 'Azul',    tipoCamion: 'Tracto Camión'   },
];

const MOCK_PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Cobre',     unidad: 'kg' },
  { id: 2, nombre: 'Aluminio',  unidad: 'kg' },
  { id: 3, nombre: 'Hierro',    unidad: 'kg' },
  { id: 4, nombre: 'Plástico',  unidad: 'kg' },
  { id: 5, nombre: 'Papel',     unidad: 'kg' },
];

const MOCK_PESAJES: PesajeCamionera[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-balanza-camionera',
  templateUrl: './balanza-camionera.component.html',
})
export class BalanzaCamioneraComponent implements OnInit, OnDestroy {

  readonly Math = Math;

  private fb             = inject(FormBuilder);
  private msgService     = inject(MessageService);
  private confirmService = inject(ConfirmationService);
  private truckScaleReader = inject(TruckScaleReaderService);

  // ── Permisos (mock — conectar con tu AuthService / ValidatorsService) ─────
  readonly isAdmin        = signal<boolean>(true);    // cambiar con tu servicio
  readonly esUsuarioBalanza = signal<boolean>(true);  // cambiar con tu servicio

  // ── Estado UI ─────────────────────────────────────────────────────────────
  dialogVisible    = signal<boolean>(false);
  dialogSegundo    = signal<boolean>(false);
  dialogVer        = signal<boolean>(false);
  modoDialog       = signal<ModoDialog>('PRIMER_PESO');
  selectedPesaje   = signal<PesajeCamionera | null>(null);
  loading          = signal<boolean>(false);
  mostrarFiltros   = signal<boolean>(true);

  // ── Peso en tiempo real desde la balanza ──────────────────────────────────
  pesoActual       = signal<number | null>(null);
  conectandoBalanza = signal<boolean>(false);
  mensajeBalanza   = signal('Listo para leer desde el servidor');
  estadoBalanza    = signal<'idle' | 'success' | 'error'>('idle');
  private pesoInterval: ReturnType<typeof setTimeout> | null = null;
  private ventanaPeso: Window | null = null;
  private canalPantallaPeso: BroadcastChannel | null = null;
  private readonly canalPantallaPesoNombre = 'recumet-balanza-peso';

  // ── Filtros ───────────────────────────────────────────────────────────────
  filtroTipo       = signal<'dia' | 'mes' | 'anio'>('dia');
  filtroBoleta     = signal<string>('');
  filtroProveedor  = signal<string>('');
  filtroFecha      = signal<Date>(new Date());

  // ── Datos maestros ────────────────────────────────────────────────────────
  pesajes          = signal<PesajeCamionera[]>(MOCK_PESAJES);
  proveedores      = signal<Proveedor[]>(MOCK_PROVEEDORES);
  transportistas   = signal<Transportista[]>(MOCK_TRANSPORTISTAS);
  productos        = signal<Producto[]>(MOCK_PRODUCTOS);

  // Sugerencias búsqueda
  sugOrigen        = signal<Proveedor[]>([]);
  sugDestino       = signal<Proveedor[]>([]);
  sugTransportista = signal<Transportista[]>([]);
  sugProducto      = signal<Producto[]>([]);
  sugBuscarBoleta  = signal<PesajeCamionera[]>([]);

  // ── Formularios ───────────────────────────────────────────────────────────
  formPrimer!  : FormGroup;
  formSegundo! : FormGroup;

  // ── Computed: lista filtrada ───────────────────────────────────────────────
  pesajesFiltrados = computed(() => {
    const fecha   = this.filtroFecha();
    const tipo    = this.filtroTipo();
    const boleta  = this.filtroBoleta().toLowerCase();
    const prov    = this.filtroProveedor().toLowerCase();

    return this.pesajes().filter(p => {
      const fReg = new Date(p.fechaRegistro);
      let pasaFecha = true;

      if (tipo === 'dia') {
        pasaFecha = fReg.toDateString() === fecha.toDateString();
      } else if (tipo === 'mes') {
        pasaFecha = fReg.getMonth() === fecha.getMonth() &&
                    fReg.getFullYear() === fecha.getFullYear();
      } else {
        pasaFecha = fReg.getFullYear() === fecha.getFullYear();
      }

      const pasaBoleta = !boleta ||
        p.nroBoleta.toLowerCase().includes(boleta);
      const pasaProv = !prov ||
        p.proveedorOrigen.nombre.toLowerCase().includes(prov) ||
        p.proveedorDestino.nombre.toLowerCase().includes(prov);

      return pasaFecha && pasaBoleta && pasaProv;
    });
  });

  // ── Stats computed ─────────────────────────────────────────────────────────
  totalPesajes  = computed(() => this.pesajesFiltrados().length);
  totalCompletos= computed(() => this.pesajesFiltrados().filter(p => p.estado === 'COMPLETO').length);
  totalPendient = computed(() => this.pesajesFiltrados().filter(p => p.estado === 'PRIMER_PESO').length);
  totalNetoKg   = computed(() =>
    this.pesajesFiltrados()
      .filter(p => p.estado === 'COMPLETO')
      .reduce((a, p) => a + p.neto, 0)
  );

  // ── Opciones dropdowns ────────────────────────────────────────────────────
  opcionesFiltroTipo = [
    { label: 'Día',  value: 'dia'  },
    { label: 'Mes',  value: 'mes'  },
    { label: 'Año',  value: 'anio' },
  ];

  // ── Correlativo boleta ────────────────────────────────────────────────────
  private get siguienteBoleta(): string {
    const num = this.pesajes().reduce((highest, item) => {
      const sequence = Number(item.nroBoleta.match(/(\d+)$/)?.[1] || 0);
      return Math.max(highest, sequence);
    }, 0) + 1;
    return `BALC-CBBA-${String(num).padStart(5, '0')}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildFormPrimer();
    this.buildFormSegundo();
    void this.cargarPesajes();
  }

  private async cargarPesajes(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.truckScaleReader.listWeighings());
      this.pesajes.set(response.weighings.map(record => this.mapearPesaje(record)));
    } catch (error) {
      const detail = error instanceof HttpErrorResponse
        ? error.error?.errors?.[0]?.msg || 'No se pudieron cargar los pesajes guardados.'
        : 'No se pudieron cargar los pesajes guardados.';
      this.msgService.add({ severity: 'error', summary: 'Error al consultar', detail });
    } finally {
      this.loading.set(false);
    }
  }

  private mapearPesaje(record: TruckWeighingRecord): PesajeCamionera {
    const details = record.details || {};
    return {
      id: record.id,
      nroBoleta: record.ticket,
      fechaRegistro: new Date(record.registered_at),
      horaPrimerPeso: record.first_time,
      horaSegundoPeso: record.second_time || undefined,
      tara: Number(record.first_weight),
      bruto: record.second_weight === null ? 0 : Number(record.second_weight),
      neto: record.net === null ? 0 : Number(record.net),
      proveedorOrigen: details['proveedorOrigen'] || { id: 0, ciNit: '', nombre: '—' },
      proveedorDestino: details['proveedorDestino'] || { id: 0, ciNit: '', nombre: '—' },
      transportista: details['transportista'] || { id: 0, ci: '', nombre: '—', placa: '—', marca: '', color: '', tipoCamion: '' },
      producto: details['producto'] || { id: 0, nombre: '—', unidad: 'kg' },
      esServicio: Boolean(details['esServicio']),
      precioServicio: details['precioServicio'],
      estado: record.state,
      observacion: details['observacion'],
    };
  }

  ngOnDestroy(): void {
    this.detenerLecturaPeso();
    this.canalPantallaPeso?.postMessage({ type: 'close' });
    this.canalPantallaPeso?.close();
    this.ventanaPeso = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORMULARIOS
  // ─────────────────────────────────────────────────────────────────────────

  buildFormPrimer(): void {
    const now = new Date();
    this.formPrimer = this.fb.group({
      // Balanza
      pesoCapturado    : [null],
      // Registro
      nroBoleta        : [{ value: this.siguienteBoleta, disabled: true }],
      fechaRegistro    : [now, Validators.required],
      horaPrimerPeso   : [this.horaActual(), Validators.required],
      // Origen
      origenCiNit      : ['', Validators.required],
      origenNombre     : [{ value: '', disabled: true }],
      // Destino
      destinoCiNit     : ['', Validators.required],
      destinoNombre    : [{ value: '', disabled: true }],
      // Transportista
      transportistaCi  : ['', Validators.required],
      transportistaNombre: [{ value: '', disabled: true }],
      placa            : ['', Validators.required],
      marca            : [{ value: '', disabled: true }],
      color            : [{ value: '', disabled: true }],
      tipoCamion       : [{ value: '', disabled: true }],
      // Producto
      productoId       : ['', Validators.required],
      productoNombre   : [{ value: '', disabled: true }],
      productoUnidad   : [{ value: '', disabled: true }],
      // Servicio
      esServicio       : [false],
      precioServicio   : [null],
      // Peso
      tara             : [null, [Validators.required, Validators.min(1)]],
      observacion      : [''],
    });
  }

  buildFormSegundo(): void {
    this.formSegundo = this.fb.group({
      buscarBoleta     : [''],
      buscarPlaca      : [''],
      // Info (disabled — solo lectura)
      nroBoleta        : [{ value: '', disabled: true }],
      proveedorOrigen  : [{ value: '', disabled: true }],
      producto         : [{ value: '', disabled: true }],
      horaPrimerPeso   : [{ value: '', disabled: true }],
      // Dato a registrar
      horaSegundoPeso  : [this.horaActual(), Validators.required],
      bruto            : [null, [Validators.required, Validators.min(1)]],
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PESO DESDE BALANZA (API del backend con lectura TCP)
  // ─────────────────────────────────────────────────────────────────────────

  async leerPesoBalanza(): Promise<void> {
    if (this.conectandoBalanza()) return;
    this.conectandoBalanza.set(true);
    try {
      const data = await firstValueFrom(this.truckScaleReader.readWeight());
      const peso = Number(data.peso);
      if (!Number.isFinite(peso) || peso < 0) throw new Error('El servidor devolvió un peso no válido.');
      this.pesoActual.set(peso);
      this.estadoBalanza.set('success');
      this.mensajeBalanza.set(`Peso capturado: ${peso.toLocaleString('es-BO')} kg`);
      this.publicarPesoEnPantalla();
      // Setear en el campo activo según modo
      if (this.modoDialog() === 'PRIMER_PESO') {
        this.formPrimer.patchValue({ pesoCapturado: peso, tara: peso });
      } else if (this.modoDialog() === 'SEGUNDO_PESO') {
        this.formSegundo.patchValue({ bruto: peso });
      }
    } catch (error) {
      const backendMessage = error instanceof HttpErrorResponse
        ? error.error?.errors?.[0]?.msg
        : undefined;
      const localAgentUnavailable = environment.truckScaleReaderMode === 'local-agent'
        ? 'Inicie el agente local RECUMET y permita el acceso a la red local en el navegador.'
        : 'Verifique que el backend local esté activo y conectado con la balanza.';
      const detail = backendMessage || (
        error instanceof HttpErrorResponse && error.status === 0
          ? localAgentUnavailable
          : error instanceof Error
            ? error.message
            : 'Verifique la conexión y la configuración de la balanza.'
      );
      this.estadoBalanza.set('error');
      this.mensajeBalanza.set(detail);
      this.msgService.add({ severity: 'error', summary: 'No se pudo leer la balanza', detail });
    } finally {
      this.conectandoBalanza.set(false);
      this.programarSiguienteLectura();
    }
  }

  iniciarLecturaAutomatica(): void {
    this.detenerLecturaPeso();
    void this.leerPesoBalanza();
  }

  detenerLecturaPeso(): void {
    if (this.pesoInterval !== null) {
      clearTimeout(this.pesoInterval);
      this.pesoInterval = null;
    }
  }

  abrirPantallaCompleta(): void {
    this.canalPantallaPeso ??= new BroadcastChannel(this.canalPantallaPesoNombre);
    this.canalPantallaPeso.onmessage = ({ data }) => {
      if (data?.type === 'ready') this.publicarPesoEnPantalla();
      if (data?.type === 'closed') {
        this.ventanaPeso = null;
        this.programarSiguienteLectura();
      }
    };

    const displayWindow = window.open(
      `${window.location.origin}/scale-display`,
      'recumet-scale-weight-display',
      'popup=yes,width=1280,height=800,resizable=yes,scrollbars=no',
    );

    if (!displayWindow) {
      this.msgService.add({ severity: 'warn', summary: 'Ventana bloqueada',
        detail: 'Permita las ventanas emergentes de RECUMET para mostrar el pesaje.' });
      return;
    }

    this.ventanaPeso = displayWindow;
    this.publicarPesoEnPantalla();
    this.iniciarLecturaAutomatica();
  }

  private publicarPesoEnPantalla(): void {
    this.canalPantallaPeso?.postMessage({ type: 'weight', peso: this.pesoActual() ?? 0 });
  }

  private programarSiguienteLectura(): void {
    this.detenerLecturaPeso();
    const peso = this.pesoActual();
    const hayVistaActiva = this.dialogVisible() || this.dialogSegundo()
      || (this.ventanaPeso !== null && !this.ventanaPeso.closed);

    if (peso === null || peso <= 0 || !hayVistaActiva) return;

    this.pesoInterval = setTimeout(() => {
      this.pesoInterval = null;
      void this.leerPesoBalanza();
    }, 2000);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BÚSQUEDAS AUTOCOMPLETE
  // ─────────────────────────────────────────────────────────────────────────

  buscarOrigen(q: string): void {
    if (!q || q.length < 2) { this.sugOrigen.set([]); return; }
    this.sugOrigen.set(
      this.proveedores().filter(p =>
        p.ciNit.includes(q) || p.nombre.toLowerCase().includes(q.toLowerCase())
      )
    );
  }

  seleccionarOrigen(p: Proveedor): void {
    this.formPrimer.patchValue({ origenCiNit: p.ciNit, origenNombre: p.nombre });
    this.sugOrigen.set([]);
  }

  buscarDestino(q: string): void {
    if (!q || q.length < 2) { this.sugDestino.set([]); return; }
    this.sugDestino.set(
      this.proveedores().filter(p =>
        p.ciNit.includes(q) || p.nombre.toLowerCase().includes(q.toLowerCase())
      )
    );
  }

  seleccionarDestino(p: Proveedor): void {
    this.formPrimer.patchValue({ destinoCiNit: p.ciNit, destinoNombre: p.nombre });
    this.sugDestino.set([]);
  }

  buscarTransportista(q: string): void {
    if (!q || q.length < 2) { this.sugTransportista.set([]); return; }
    this.sugTransportista.set(
      this.transportistas().filter(t =>
        t.ci.includes(q) || t.nombre.toLowerCase().includes(q.toLowerCase())
      )
    );
  }

  seleccionarTransportista(t: Transportista): void {
    this.formPrimer.patchValue({
      transportistaCi    : t.ci,
      transportistaNombre: t.nombre,
      placa              : t.placa,
      marca              : t.marca,
      color              : t.color,
      tipoCamion         : t.tipoCamion,
    });
    this.sugTransportista.set([]);
  }

  buscarPorPlaca(placa: string): void {
    if (!placa || placa.length < 3) { this.sugTransportista.set([]); return; }
    const t = this.transportistas().find(x =>
      x.placa.toLowerCase().includes(placa.toLowerCase())
    );
    if (t) this.seleccionarTransportista(t);
  }

  buscarProducto(q: string): void {
    if (!q || q.length < 2) { this.sugProducto.set([]); return; }
    this.sugProducto.set(
      this.productos().filter(p =>
        p.nombre.toLowerCase().includes(q.toLowerCase())
      )
    );
  }

  seleccionarProducto(p: Producto): void {
    this.formPrimer.patchValue({
      productoId    : p.id,
      productoNombre: p.nombre,
      productoUnidad: p.unidad,
    });
    this.sugProducto.set([]);
  }

  // Búsqueda para segundo peso
  buscarBoletaSegundo(q: string): void {
    if (!q) { this.sugBuscarBoleta.set([]); return; }
    this.sugBuscarBoleta.set(
      this.pesajes().filter(p =>
        p.estado === 'PRIMER_PESO' &&
        (p.nroBoleta.toLowerCase().includes(q.toLowerCase()) ||
         p.transportista.placa.toLowerCase().includes(q.toLowerCase()))
      )
    );
  }

  seleccionarParaSegundoPeso(p: PesajeCamionera): void {
    this.selectedPesaje.set(p);
    this.formSegundo.patchValue({
      nroBoleta      : p.nroBoleta,
      proveedorOrigen: p.proveedorOrigen.nombre,
      producto       : p.producto.nombre,
      horaPrimerPeso : p.horaPrimerPeso,
      horaSegundoPeso: this.horaActual(),
      bruto          : null,
    });
    this.sugBuscarBoleta.set([]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DIALOGS
  // ─────────────────────────────────────────────────────────────────────────

  openNuevoPrimer(): void {
    this.modoDialog.set('PRIMER_PESO');
    this.selectedPesaje.set(null);
    this.buildFormPrimer();
    this.formPrimer.patchValue({
      nroBoleta       : this.siguienteBoleta,
      fechaRegistro   : new Date(),
      horaPrimerPeso  : this.horaActual(),
    });
    this.pesoActual.set(null);
    this.estadoBalanza.set('idle');
    this.mensajeBalanza.set('Listo para leer desde el servidor');
    this.dialogVisible.set(true);
  }

  openSegundoPeso(): void {
    this.modoDialog.set('SEGUNDO_PESO');
    this.selectedPesaje.set(null);
    this.buildFormSegundo();
    this.pesoActual.set(null);
    this.estadoBalanza.set('idle');
    this.mensajeBalanza.set('Listo para leer desde el servidor');
    this.dialogSegundo.set(true);
  }

  openVer(p: PesajeCamionera): void {
    this.selectedPesaje.set(p);
    this.dialogVer.set(true);
  }

  openEditar(p: PesajeCamionera): void {
    if (!this.puedeEditar(p)) {
      this.msgService.add({ severity: 'warn', summary: 'Sin permiso',
        detail: 'Solo puede editar registros del día o si es administrador' });
      return;
    }
    this.modoDialog.set('EDITAR');
    this.formPrimer.patchValue({
      nroBoleta        : p.nroBoleta,
      fechaRegistro    : p.fechaRegistro,
      horaPrimerPeso   : p.horaPrimerPeso,
      origenCiNit      : p.proveedorOrigen.ciNit,
      origenNombre     : p.proveedorOrigen.nombre,
      destinoCiNit     : p.proveedorDestino.ciNit,
      destinoNombre    : p.proveedorDestino.nombre,
      transportistaCi  : p.transportista.ci,
      transportistaNombre: p.transportista.nombre,
      placa            : p.transportista.placa,
      marca            : p.transportista.marca,
      color            : p.transportista.color,
      tipoCamion       : p.transportista.tipoCamion,
      productoId       : p.producto.id,
      productoNombre   : p.producto.nombre,
      productoUnidad   : p.producto.unidad,
      esServicio       : p.esServicio,
      precioServicio   : p.precioServicio ?? null,
      tara             : p.tara,
      observacion      : p.observacion ?? '',
    });
    this.selectedPesaje.set(p);
    this.dialogVisible.set(true);
  }

  closeDialog():  void { this.dialogVisible.set(false);  this.programarSiguienteLectura(); }
  onDialogHide(): void { this.dialogVisible.set(false);  this.programarSiguienteLectura(); }
  closeSegundo(): void { this.dialogSegundo.set(false);  this.programarSiguienteLectura(); }
  closeVer():     void { this.dialogVer.set(false); }

  // ─────────────────────────────────────────────────────────────────────────
  // GUARDAR
  // ─────────────────────────────────────────────────────────────────────────

  async guardarPrimerPeso(): Promise<void> {
    if (this.formPrimer.invalid) { this.formPrimer.markAllAsTouched(); return; }
    const v = this.formPrimer.getRawValue();
    const payload = {
      ticket: v.nroBoleta,
      registered_at: new Date(v.fechaRegistro).toISOString(),
      first_weight: Number(v.tara),
      first_time: v.horaPrimerPeso,
      details: {
        proveedorOrigen: { id: 0, ciNit: v.origenCiNit, nombre: v.origenNombre },
        proveedorDestino: { id: 0, ciNit: v.destinoCiNit, nombre: v.destinoNombre },
        transportista: { id: 0, ci: v.transportistaCi, nombre: v.transportistaNombre, placa: v.placa, marca: v.marca, color: v.color, tipoCamion: v.tipoCamion },
        producto: { id: v.productoId, nombre: v.productoNombre, unidad: v.productoUnidad },
        esServicio: v.esServicio,
        precioServicio: v.esServicio ? v.precioServicio : undefined,
        observacion: v.observacion,
      },
    };
    this.loading.set(true);
    try {
      const selected = this.selectedPesaje();
      const response = await firstValueFrom(this.modoDialog() === 'EDITAR' && selected
        ? this.truckScaleReader.updateFirstWeight(selected.id, payload)
        : this.truckScaleReader.createFirstWeight(payload));
      const nuevo = this.mapearPesaje(response.weighing);
      this.pesajes.update(list => selected
        ? list.map(item => item.id === nuevo.id ? nuevo : item)
        : [nuevo, ...list]);
      this.msgService.add({ severity: 'success', summary: selected ? 'Actualizado' : 'Registrado',
        detail: selected ? 'Pesaje actualizado correctamente.' : `Primer peso registrado: ${nuevo.nroBoleta}` });
      this.closeDialog();
    } catch (error) {
      const detail = error instanceof HttpErrorResponse
        ? error.error?.errors?.[0]?.msg || 'No se pudo guardar el primer peso.'
        : 'No se pudo guardar el primer peso.';
      this.msgService.add({ severity: 'error', summary: 'Error al guardar', detail });
    } finally {
      this.loading.set(false);
    }
  }

  async guardarSegundoPeso(): Promise<void> {
    if (this.formSegundo.invalid) { this.formSegundo.markAllAsTouched(); return; }
    const v = this.formSegundo.getRawValue();
    const original = this.selectedPesaje();
    if (!original) return;

    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.truckScaleReader.completeSecondWeight(original.id, {
        second_weight: Number(v.bruto), second_time: v.horaSegundoPeso,
      }));
      const completed = this.mapearPesaje(response.weighing);
      this.pesajes.update(list => list.map(p => p.id === completed.id ? completed : p));
      this.msgService.add({ severity: 'success', summary: 'Completado',
        detail: `Segundo peso registrado. Neto: ${completed.neto.toLocaleString('es-BO')} kg` });
      this.closeSegundo();
    } catch (error) {
      const detail = error instanceof HttpErrorResponse
        ? error.error?.errors?.[0]?.msg || 'No se pudo guardar el segundo peso.'
        : 'No se pudo guardar el segundo peso.';
      this.msgService.add({ severity: 'error', summary: 'Error al guardar', detail });
    } finally {
      this.loading.set(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ELIMINAR
  // ─────────────────────────────────────────────────────────────────────────

  confirmEliminar(p: PesajeCamionera): void {
    if (!this.puedeEliminar(p)) {
      this.msgService.add({ severity: 'warn', summary: 'Sin permiso',
        detail: 'Solo puede eliminar registros del día o si es administrador' });
      return;
    }
    this.confirmService.confirm({
      message : `¿Eliminar el registro ${p.nroBoleta}? Esta acción no se puede deshacer.`,
      header  : 'Confirmar Eliminación',
      icon    : 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept  : () => {
        void this.eliminarPesaje(p);
      },
    });
  }

  private async eliminarPesaje(p: PesajeCamionera): Promise<void> {
    try {
      await firstValueFrom(this.truckScaleReader.deleteWeighing(p.id));
      this.pesajes.update(list => list.filter(item => item.id !== p.id));
      this.msgService.add({ severity: 'success', summary: 'Eliminado', detail: `Registro ${p.nroBoleta} eliminado` });
    } catch (error) {
      const detail = error instanceof HttpErrorResponse
        ? error.error?.errors?.[0]?.msg || 'No se pudo eliminar el pesaje.'
        : 'No se pudo eliminar el pesaje.';
      this.msgService.add({ severity: 'error', summary: 'Error al eliminar', detail });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERMISOS
  // ─────────────────────────────────────────────────────────────────────────

  private esHoy(fecha: Date): boolean {
    return new Date(fecha).toDateString() === new Date().toDateString();
  }

  puedeEditar(p: PesajeCamionera): boolean {
    return this.isAdmin() || this.esHoy(p.fechaRegistro);
  }

  puedeEliminar(p: PesajeCamionera): boolean {
    return this.isAdmin() || this.esHoy(p.fechaRegistro);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTES
  // ─────────────────────────────────────────────────────────────────────────

  imprimirBoleta(p: PesajeCamionera): void {
    this.msgService.add({ severity: 'info', summary: 'Generando PDF',
      detail: `Boleta ${p.nroBoleta} - media carta` });
    // TODO: integrar con jsPDF o ngx-extended-pdf-viewer
    window.print();
  }

  exportarPDF(): void {
    this.msgService.add({ severity: 'info', summary: 'Exportando',
      detail: `Reporte PDF con ${this.pesajesFiltrados().length} registros` });
    // TODO: integrar librería PDF
  }

  exportarExcel(): void {
    this.msgService.add({ severity: 'info', summary: 'Exportando',
      detail: `Reporte Excel con ${this.pesajesFiltrados().length} registros` });
    // TODO: integrar xlsx / exceljs
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  horaActual(): string {
    return new Date().toLocaleTimeString('es-BO', { hour12: false });
  }

  getSeverity(estado: string): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<string, any> = {
      COMPLETO    : 'success',
      PRIMER_PESO : 'warning',
      ANULADO     : 'danger',
    };
    return map[estado] ?? 'info';
  }

  getEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      COMPLETO    : 'Completo',
      PRIMER_PESO : '1° Peso',
      ANULADO     : 'Anulado',
    };
    return map[estado] ?? estado;
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  setFiltroTipo(tipo: 'dia' | 'mes' | 'anio'): void { this.filtroTipo.set(tipo); }
  setFiltroBoleta(v: string):    void { this.filtroBoleta.set(v);    }
  setFiltroProveedor(v: string): void { this.filtroProveedor.set(v); }
  setFiltroFecha(v: Date):       void { this.filtroFecha.set(v);     }
  toggleFiltros():               void { this.mostrarFiltros.update(v => !v); }
}
