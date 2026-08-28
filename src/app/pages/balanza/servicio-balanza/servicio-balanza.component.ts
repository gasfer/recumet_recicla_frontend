import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

export type EstadoServicio = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';
export type TipoServicio   = 'CALIBRACION' | 'MANTENIMIENTO' | 'REPARACION' | 'VERIFICACION';

export interface ServicioBalanza {
  id?           : number;
  nroOrden      : string;
  fecha         : Date;
  fechaPromesa  : Date;
  tipoServicio  : TipoServicio;
  equipo        : string;
  marca         : string;
  modelo        : string;
  serie         : string;
  cliente       : string;
  telefono      : string;
  tecnico       : string;
  descripcion   : string;
  diagnostico?  : string;
  costo         : number;
  estado        : EstadoServicio;
  observacion?  : string;
}

@Component({
  selector: 'app-servicio-balanza',
  templateUrl: './servicio-balanza.component.html',
})
export class ServicioBalanzaComponent implements OnInit {

  form!         : FormGroup;
  dialogVisible  = signal<boolean>(false);
  loading        = signal<boolean>(false);
  isEditing      = signal<boolean>(false);
  selectedId     = signal<number | null>(null);
  viewDetail     = signal<ServicioBalanza | null>(null);
  detailVisible  = signal<boolean>(false);

  servicios = signal<ServicioBalanza[]>([
    {
      id: 1, nroOrden: 'OS-0001', fecha: new Date(),
      fechaPromesa: new Date(Date.now() + 3 * 86400000),
      tipoServicio: 'CALIBRACION', equipo: 'Balanza de Piso',
      marca: 'OHAUS', modelo: 'Defender 5000', serie: 'D52XW600RTX',
      cliente: 'Supermercado El Sol', telefono: '76543210',
      tecnico: 'Pedro Vargas',
      descripcion: 'Calibración anual de balanza de piso',
      diagnostico: 'Desviación de ±0.5kg detectada',
      costo: 350, estado: 'COMPLETADO',
    },
    {
      id: 2, nroOrden: 'OS-0002', fecha: new Date(),
      fechaPromesa: new Date(Date.now() + 2 * 86400000),
      tipoServicio: 'REPARACION', equipo: 'Balanza Camionera',
      marca: 'Mettler Toledo', modelo: 'ICS465', serie: 'MT23456',
      cliente: 'Agro Norte S.R.L.', telefono: '71234567',
      tecnico: 'Carlos Rojas',
      descripcion: 'Sensor de carga dañado - requiere reemplazo',
      costo: 1200, estado: 'EN_PROCESO',
    },
    {
      id: 3, nroOrden: 'OS-0003', fecha: new Date(),
      fechaPromesa: new Date(Date.now() + 5 * 86400000),
      tipoServicio: 'MANTENIMIENTO', equipo: 'Balanza Analítica',
      marca: 'Shimadzu', modelo: 'AUX220', serie: 'C31506',
      cliente: 'Laboratorio Farma', telefono: '79876543',
      tecnico: 'Ana Gutiérrez',
      descripcion: 'Mantenimiento preventivo semestral',
      costo: 180, estado: 'PENDIENTE',
    },
  ]);

  totalServicios = computed(() => this.servicios().length);
  pendientes     = computed(() => this.servicios().filter(s => s.estado === 'PENDIENTE').length);
  enProceso      = computed(() => this.servicios().filter(s => s.estado === 'EN_PROCESO').length);
  completados    = computed(() => this.servicios().filter(s => s.estado === 'COMPLETADO').length);

  tiposServicio = [
    { label: 'Calibración',   value: 'CALIBRACION'  },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    { label: 'Reparación',    value: 'REPARACION'    },
    { label: 'Verificación',  value: 'VERIFICACION'  },
  ];

  estados = [
    { label: 'Pendiente',  value: 'PENDIENTE'  },
    { label: 'En Proceso', value: 'EN_PROCESO' },
    { label: 'Completado', value: 'COMPLETADO' },
    { label: 'Cancelado',  value: 'CANCELADO'  },
  ];

  tecnicos = [
    { label: 'Pedro Vargas',  value: 'Pedro Vargas'  },
    { label: 'Carlos Rojas',  value: 'Carlos Rojas'  },
    { label: 'Ana Gutiérrez', value: 'Ana Gutiérrez' },
  ];

  constructor(
    private fb             : FormBuilder,
    private msgService     : MessageService,
    private confirmService : ConfirmationService,
  ) {}

  ngOnInit(): void { this.buildForm(); }

  buildForm(): void {
    const tomorrow = new Date(Date.now() + 86400000);
    this.form = this.fb.group({
      nroOrden    : ['', Validators.required],
      fecha       : [new Date(), Validators.required],
      fechaPromesa: [tomorrow, Validators.required],
      tipoServicio: ['', Validators.required],
      equipo      : ['', Validators.required],
      marca       : ['', Validators.required],
      modelo      : [''],
      serie       : [''],
      cliente     : ['', Validators.required],
      telefono    : [''],
      tecnico     : ['', Validators.required],
      descripcion : ['', Validators.required],
      diagnostico : [''],
      costo       : [0, [Validators.required, Validators.min(0)]],
      estado      : ['PENDIENTE', Validators.required],
      observacion : [''],
    });
  }

  // ── Dialog helpers ────────────────────────────────────────────────────────
  closeDialog(): void       { this.dialogVisible.set(false); }
  onDialogHide(): void      { this.dialogVisible.set(false); }
  closeDetail(): void       { this.detailVisible.set(false); }
  onDetailHide(): void      { this.detailVisible.set(false); }

  openNew(): void {
    this.isEditing.set(false);
    this.selectedId.set(null);
    this.form.reset({
      fecha        : new Date(),
      fechaPromesa : new Date(Date.now() + 86400000),
      estado       : 'PENDIENTE',
      costo        : 0,
    });
    const next = 'OS-' + String(this.servicios().length + 1).padStart(4, '0');
    this.form.patchValue({ nroOrden: next });
    this.dialogVisible.set(true);
  }

  openEdit(s: ServicioBalanza): void {
    this.isEditing.set(true);
    this.selectedId.set(s.id!);
    this.form.patchValue({ ...s });
    this.dialogVisible.set(true);
  }

  openDetail(s: ServicioBalanza): void {
    this.viewDetail.set(s);
    this.detailVisible.set(true);
  }

  openEditFromDetail(): void {
    const s = this.viewDetail();
    if (!s) return;
    this.closeDetail();
    this.openEdit(s);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;

    if (this.isEditing()) {
      this.servicios.update(list =>
        list.map(s =>
          s.id === this.selectedId() ? { ...s, ...val } as ServicioBalanza : s
        )
      );
      this.msgService.add({ severity: 'success', summary: 'Actualizado',
        detail: 'Orden de servicio actualizada' });
    } else {
      this.servicios.update(list => [...list, { ...val, id: Date.now() }]);
      this.msgService.add({ severity: 'success', summary: 'Creado',
        detail: 'Orden de servicio creada' });
    }
    this.closeDialog();
  }

  confirmDelete(s: ServicioBalanza): void {
    this.confirmService.confirm({
      message : `¿Cancelar la orden ${s.nroOrden}?`,
      header  : 'Cancelar Servicio',
      icon    : 'pi pi-exclamation-triangle',
      accept  : () => {
        this.servicios.update(list =>
          list.map(x => x.id === s.id ? { ...x, estado: 'CANCELADO' } : x)
        );
        this.msgService.add({ severity: 'warn', summary: 'Cancelado',
          detail: `Orden ${s.nroOrden} cancelada` });
      },
    });
  }

  getSeverity(estado: EstadoServicio): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<EstadoServicio, 'success' | 'warning' | 'danger' | 'info'> = {
      COMPLETADO : 'success',
      PENDIENTE  : 'warning',
      CANCELADO  : 'danger',
      EN_PROCESO : 'info',
    };
    return map[estado];
  }

  getTipoSeverity(tipo: TipoServicio): 'success' | 'warning' | 'danger' | 'info' {
    const map: Record<TipoServicio, 'success' | 'warning' | 'danger' | 'info'> = {
      CALIBRACION   : 'info',
      MANTENIMIENTO : 'success',
      REPARACION    : 'danger',
      VERIFICACION  : 'warning',
    };
    return map[tipo];
  }

  getEstadoLabel(estado: EstadoServicio): string {
    const map: Record<EstadoServicio, string> = {
      COMPLETADO : 'Completado',
      PENDIENTE  : 'Pendiente',
      CANCELADO  : 'Cancelado',
      EN_PROCESO : 'En Proceso',
    };
    return map[estado];
  }

  getTipoLabel(tipo: TipoServicio): string {
    const map: Record<TipoServicio, string> = {
      CALIBRACION   : 'Calibración',
      MANTENIMIENTO : 'Mantenimiento',
      REPARACION    : 'Reparación',
      VERIFICACION  : 'Verificación',
    };
    return map[tipo];
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
