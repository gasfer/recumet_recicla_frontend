import {
  Component, OnInit, OnDestroy,
  signal, computed, inject
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

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

const hoy = new Date();
const MOCK_PESAJES: PesajeCamionera[] = [
  {
    id: 1, nroBoleta: 'BALC-CBBA-00001',
    fechaRegistro: hoy, horaPrimerPeso: '08:32:15', horaSegundoPeso: '10:15:42',
    tara: 28500, bruto: 8200, neto: 20300,
    proveedorOrigen : MOCK_PROVEEDORES[0],
    proveedorDestino: MOCK_PROVEEDORES[3],
    transportista   : MOCK_TRANSPORTISTAS[0],
    producto        : MOCK_PRODUCTOS[0],
    esServicio: false, estado: 'COMPLETO',
  },
  {
    id: 2, nroBoleta: 'BALC-CBBA-00002',
    fechaRegistro: hoy, horaPrimerPeso: '09:10:00', horaSegundoPeso: '11:45:30',
    tara: 32000, bruto: 8500, neto: 23500,
    proveedorOrigen : MOCK_PROVEEDORES[1],
    proveedorDestino: MOCK_PROVEEDORES[4],
    transportista   : MOCK_TRANSPORTISTAS[1],
    producto        : MOCK_PRODUCTOS[1],
    esServicio: true, precioServicio: 150, estado: 'COMPLETO',
  },
  {
    id: 3, nroBoleta: 'BALC-CBBA-00003',
    fechaRegistro: hoy, horaPrimerPeso: '11:20:05',
    tara: 25000, bruto: 0, neto: 0,
    proveedorOrigen : MOCK_PROVEEDORES[2],
    proveedorDestino: MOCK_PROVEEDORES[3],
    transportista   : MOCK_TRANSPORTISTAS[2],
    producto        : MOCK_PRODUCTOS[2],
    esServicio: false, estado: 'PRIMER_PESO',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-balanza-camionera',
  templateUrl: './balanza-camionera.component.html',
})
export class BalanzaCamioneraComponent implements OnInit, OnDestroy {

  private fb             = inject(FormBuilder);
  private msgService     = inject(MessageService);
  private confirmService = inject(ConfirmationService);

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
  private pesoInterval: any;
  readonly BALANZA_URL = 'http://192.168.0.240:8000';

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
    const num = this.pesajes().length + 1;
    return `BALC-CBBA-${String(num).padStart(5, '0')}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildFormPrimer();
    this.buildFormSegundo();
  }

  ngOnDestroy(): void {
    this.detenerLecturaPeso();
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
  // PESO DESDE BALANZA (API REST)
  // ─────────────────────────────────────────────────────────────────────────

  async leerPesoBalanza(): Promise<void> {
    this.conectandoBalanza.set(true);
    try {
      const resp = await fetch(`${this.BALANZA_URL}/peso`, { signal: AbortSignal.timeout(3000) });
      if (!resp.ok) throw new Error('Sin respuesta');
      const data = await resp.json();
      const peso = parseFloat(data.peso ?? data.weight ?? data.value ?? 0);
      this.pesoActual.set(peso);
      // Setear en el campo activo según modo
      if (this.modoDialog() === 'PRIMER_PESO') {
        this.formPrimer.patchValue({ pesoCapturado: peso, tara: peso });
      } else if (this.modoDialog() === 'SEGUNDO_PESO') {
        this.formSegundo.patchValue({ bruto: peso });
      }
    } catch {
      // Simulación offline para demo
      const pesoSim = Math.floor(Math.random() * 5000) + 25000;
      this.pesoActual.set(pesoSim);
      if (this.modoDialog() === 'PRIMER_PESO') {
        this.formPrimer.patchValue({ pesoCapturado: pesoSim, tara: pesoSim });
      } else {
        this.formSegundo.patchValue({ bruto: pesoSim });
      }
      this.msgService.add({ severity: 'warn', summary: 'Balanza offline',
        detail: 'Usando peso simulado. Conectar balanza en 192.168.0.240:8000' });
    } finally {
      this.conectandoBalanza.set(false);
    }
  }

  iniciarLecturaAutomatica(): void {
    this.detenerLecturaPeso();
    this.pesoInterval = setInterval(() => this.leerPesoBalanza(), 3000);
  }

  detenerLecturaPeso(): void {
    if (this.pesoInterval) { clearInterval(this.pesoInterval); this.pesoInterval = null; }
  }

  abrirPantallaCompleta(): void {
    const url = `/balanzas/pantalla-peso?ip=${this.BALANZA_URL}`;
    window.open(url, '_blank', 'fullscreen=yes,width=1920,height=1080');
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
    this.buildFormPrimer();
    this.formPrimer.patchValue({
      nroBoleta       : this.siguienteBoleta,
      fechaRegistro   : new Date(),
      horaPrimerPeso  : this.horaActual(),
    });
    this.pesoActual.set(null);
    this.dialogVisible.set(true);
  }

  openSegundoPeso(): void {
    this.modoDialog.set('SEGUNDO_PESO');
    this.buildFormSegundo();
    this.pesoActual.set(null);
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

  closeDialog():  void { this.dialogVisible.set(false);  this.detenerLecturaPeso(); }
  onDialogHide(): void { this.dialogVisible.set(false);  this.detenerLecturaPeso(); }
  closeSegundo(): void { this.dialogSegundo.set(false);  this.detenerLecturaPeso(); }
  closeVer():     void { this.dialogVer.set(false); }

  // ─────────────────────────────────────────────────────────────────────────
  // GUARDAR
  // ─────────────────────────────────────────────────────────────────────────

  guardarPrimerPeso(): void {
    if (this.formPrimer.invalid) { this.formPrimer.markAllAsTouched(); return; }
    const v = this.formPrimer.getRawValue();

    const nuevo: PesajeCamionera = {
      id             : Date.now(),
      nroBoleta      : v.nroBoleta,
      fechaRegistro  : v.fechaRegistro,
      horaPrimerPeso : v.horaPrimerPeso,
      tara           : v.tara,
      bruto          : 0,
      neto           : 0,
      proveedorOrigen : { id: 0, ciNit: v.origenCiNit,   nombre: v.origenNombre  },
      proveedorDestino: { id: 0, ciNit: v.destinoCiNit,  nombre: v.destinoNombre },
      transportista   : {
        id: 0, ci: v.transportistaCi, nombre: v.transportistaNombre,
        placa: v.placa, marca: v.marca, color: v.color, tipoCamion: v.tipoCamion,
      },
      producto        : { id: v.productoId, nombre: v.productoNombre, unidad: v.productoUnidad },
      esServicio      : v.esServicio,
      precioServicio  : v.esServicio ? v.precioServicio : undefined,
      estado          : 'PRIMER_PESO',
      observacion     : v.observacion,
    };

    if (this.modoDialog() === 'EDITAR') {
      this.pesajes.update(list =>
        list.map(p => p.id === this.selectedPesaje()?.id ? { ...p, ...nuevo, id: p.id } : p)
      );
      this.msgService.add({ severity: 'success', summary: 'Actualizado', detail: 'Pesaje actualizado' });
    } else {
      this.pesajes.update(list => [...list, nuevo]);
      this.msgService.add({ severity: 'success', summary: 'Registrado',
        detail: `Primer peso registrado: ${nuevo.nroBoleta}` });
    }
    this.closeDialog();
  }

  guardarSegundoPeso(): void {
    if (this.formSegundo.invalid) { this.formSegundo.markAllAsTouched(); return; }
    const v = this.formSegundo.getRawValue();
    const original = this.selectedPesaje();
    if (!original) return;

    const bruto = v.bruto;
    const neto  = Math.max(0, original.tara - bruto);

    this.pesajes.update(list =>
      list.map(p =>
        p.id === original.id
          ? { ...p, bruto, neto, horaSegundoPeso: v.horaSegundoPeso, estado: 'COMPLETO' }
          : p
      )
    );
    this.msgService.add({ severity: 'success', summary: 'Completado',
      detail: `Segundo peso registrado. Neto: ${neto.toLocaleString()} kg` });
    this.closeSegundo();
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
        this.pesajes.update(list => list.filter(x => x.id !== p.id));
        this.msgService.add({ severity: 'success', summary: 'Eliminado',
          detail: `Registro ${p.nroBoleta} eliminado` });
      },
    });
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

  getSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    const map: Record<string, any> = {
      COMPLETO    : 'success',
      PRIMER_PESO : 'warn',
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
