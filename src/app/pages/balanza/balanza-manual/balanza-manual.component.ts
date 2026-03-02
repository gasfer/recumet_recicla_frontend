import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

export interface PesajeManual {
  id?         : number;
  fecha       : Date;
  nroTicket   : string;
  cliente     : string;
  producto    : string;
  unidad      : 'kg' | 'g' | 'lb' | 'qq';
  peso        : number;
  pesoKg      : number;
  precio      : number;
  total       : number;
  operador    : string;
  estado      : 'ACTIVO' | 'ANULADO';
  observacion?: string;
}

@Component({
  selector: 'app-balanza-manual',
  templateUrl: './balanza-manual.component.html',
})
export class BalanzaManualComponent implements OnInit {

  form!         : FormGroup;
  dialogVisible  = signal<boolean>(false);
  loading        = signal<boolean>(false);
  isEditing      = signal<boolean>(false);
  selectedId     = signal<number | null>(null);

  pesajes = signal<PesajeManual[]>([
    {
      id: 1, fecha: new Date(), nroTicket: 'PM-0001',
      cliente: 'María Flores', producto: 'Azúcar',
      unidad: 'kg', peso: 50, pesoKg: 50,
      precio: 5.5, total: 275, operador: 'Admin',
      estado: 'ACTIVO',
    },
    {
      id: 2, fecha: new Date(), nroTicket: 'PM-0002',
      cliente: 'Juan Quispe', producto: 'Arroz',
      unidad: 'qq', peso: 2, pesoKg: 92,
      precio: 230, total: 460, operador: 'Admin',
      estado: 'ACTIVO',
    },
  ]);

  totalRegistros = computed(() => this.pesajes().filter(p => p.estado === 'ACTIVO').length);
  totalKg        = computed(() =>
    this.pesajes().filter(p => p.estado === 'ACTIVO').reduce((a, p) => a + p.pesoKg, 0)
  );
  totalVenta     = computed(() =>
    this.pesajes().filter(p => p.estado === 'ACTIVO').reduce((a, p) => a + p.total, 0)
  );

  unidades = [
    { label: 'Kilogramos (kg)', value: 'kg' },
    { label: 'Gramos (g)',      value: 'g'  },
    { label: 'Libras (lb)',     value: 'lb' },
    { label: 'Quintales (qq)', value: 'qq' },
  ];

  productos = [
    { label: 'Azúcar',   value: 'Azúcar'   },
    { label: 'Arroz',    value: 'Arroz'    },
    { label: 'Harina',   value: 'Harina'   },
    { label: 'Sal',      value: 'Sal'      },
    { label: 'Semillas', value: 'Semillas' },
    { label: 'Otro',     value: 'Otro'     },
  ];

  constructor(
    private fb             : FormBuilder,
    private msgService     : MessageService,
    private confirmService : ConfirmationService,
  ) {}

  ngOnInit(): void { this.buildForm(); }

  buildForm(): void {
    this.form = this.fb.group({
      fecha      : [new Date(), Validators.required],
      nroTicket  : ['', Validators.required],
      cliente    : ['', Validators.required],
      producto   : ['', Validators.required],
      unidad     : ['kg', Validators.required],
      peso       : [0, [Validators.required, Validators.min(0.001)]],
      precio     : [0, [Validators.required, Validators.min(0)]],
      operador   : ['', Validators.required],
      observacion: [''],
    });
  }

  private toKg(peso: number, unidad: string): number {
    const map: Record<string, number> = { kg: 1, g: 0.001, lb: 0.4536, qq: 46 };
    return peso * (map[unidad] ?? 1);
  }

  get totalCalculado(): number {
    const peso   = this.form.get('peso')?.value   ?? 0;
    const precio = this.form.get('precio')?.value ?? 0;
    return +(peso * precio).toFixed(2);
  }

  closeDialog(): void { this.dialogVisible.set(false); }
  onDialogHide(): void { this.dialogVisible.set(false); }

  openNew(): void {
    this.isEditing.set(false);
    this.selectedId.set(null);
    this.form.reset({ fecha: new Date(), unidad: 'kg', peso: 0, precio: 0 });
    const next = 'PM-' + String(this.pesajes().length + 1).padStart(4, '0');
    this.form.patchValue({ nroTicket: next });
    this.dialogVisible.set(true);
  }

  openEdit(p: PesajeManual): void {
    this.isEditing.set(true);
    this.selectedId.set(p.id!);
    this.form.patchValue({ ...p });
    this.dialogVisible.set(true);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val    = this.form.value;
    const pesoKg = +this.toKg(val.peso, val.unidad).toFixed(3);
    const total  = this.totalCalculado;

    if (this.isEditing()) {
      this.pesajes.update(list =>
        list.map(p =>
          p.id === this.selectedId()
            ? { ...p, ...val, pesoKg, total } as PesajeManual
            : p
        )
      );
      this.msgService.add({ severity: 'success', summary: 'Actualizado',
        detail: 'Pesaje actualizado' });
    } else {
      this.pesajes.update(list => [
        ...list, { ...val, pesoKg, total, id: Date.now(), estado: 'ACTIVO' },
      ]);
      this.msgService.add({ severity: 'success', summary: 'Registrado',
        detail: 'Pesaje registrado' });
    }
    this.closeDialog();
  }

  confirmAnular(p: PesajeManual): void {
    this.confirmService.confirm({
      message : `¿Anular el ticket ${p.nroTicket}?`,
      header  : 'Anular Pesaje',
      icon    : 'pi pi-exclamation-triangle',
      accept  : () => {
        this.pesajes.update(list =>
          list.map(x => x.id === p.id ? { ...x, estado: 'ANULADO' } : x)
        );
        this.msgService.add({ severity: 'warn', summary: 'Anulado',
          detail: `Ticket ${p.nroTicket} anulado` });
      },
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
