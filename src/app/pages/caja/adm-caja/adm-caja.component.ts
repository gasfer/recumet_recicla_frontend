import { DecimalPipe } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ColsTable, SearchFor } from 'src/app/core/components/interfaces/OptionsTable.interface';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Detail, GetAllTotalesMovements } from '../interfaces/adm-caja.interface';
import { CajaService } from '../services/caja.service';

@Component({
  selector: 'app-adm-caja',
  templateUrl: './adm-caja.component.html',
  styleUrls: ['./adm-caja.component.css']
})
export class AdmCajaComponent implements OnInit, OnDestroy {

  // ── Servicios ────────────────────────────────────────────
  validatorsService = inject(ValidatorsService);
  cajaService       = inject(CajaService);
  pipeNumber        = new DecimalPipe('en-US');

  // ── Estado ───────────────────────────────────────────────
  loading       = signal(false);
  date          = signal(new Date());
  decimalLength = signal(this.validatorsService.decimalLength());
  decimal       = signal(`1.${this.decimalLength()}-${this.decimalLength()}`);

  // ── Datos ────────────────────────────────────────────────
  totalMovements = signal<GetAllTotalesMovements | undefined>(undefined);
  movementsTable = signal<{ data: Detail[] } | undefined>(undefined);
  ingresos       = signal<Detail[] | undefined>(undefined);
  gastos         = signal<Detail[] | undefined>(undefined);

  rows  = signal(50);
  page  = signal(1);
  type  = signal('');
  query = signal('');

  // ── Toggle gráfica ───────────────────────────────────────
  chartMode: 'efectivo' | 'banco' = 'efectivo';
  animating = false;

  // ── Chart data ───────────────────────────────────────────
  dataEfectivo: any = { labels: [], datasets: [] };
  dataBanco:    any = { labels: [], datasets: [] };

  chartOptions = {
    cutout: '72%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ` ${ctx.label}: Bs ${ctx.parsed.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`
        },
        backgroundColor: 'rgba(15,23,42,0.85)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        padding: 12,
        cornerRadius: 10,
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 900,
      easing: 'easeInOutQuart'
    }
  };

  // ── Totales para el centro del donut ────────────────────────────
  get totalEfectivo(): string {
    const total = (this.dataEfectivo.datasets[0]?.data as number[] ?? []).reduce((a: number, b: number) => a + b, 0);
    return total.toLocaleString('es-BO', { minimumFractionDigits: 0 });
  }

  get totalBanco(): string {
    const total = (this.dataBanco.datasets[0]?.data as number[] ?? []).reduce((a: number, b: number) => a + b, 0);
    return total.toLocaleString('es-BO', { minimumFractionDigits: 0 });
  }

  // ── Menús ────────────────────────────────────────────────
  searchItems = signal<MenuItem[]>([
    {
      label: 'Ingresos',
      icon: 'fa-solid fa-cash-register',
      iconStyle: { 'color': '#1e7e4e' },
      command: () => this.movementsTable.set({ data: this.ingresos()! })
    },
    {
      label: 'Egresos',
      icon: 'fa-solid fa-cash-register',
      iconStyle: { 'color': '#e8630a' },
      command: () => this.movementsTable.set({ data: this.ingresos()! })
    },
    {
      label: 'Gastos',
      icon: 'fa-solid fa-comment-dollar',
      iconStyle: { 'color': '#dc2626' },
      command: () => this.movementsTable.set({ data: this.gastos()! })
    }
  ]);

  optionsList = signal<MenuItem[]>([
    {
      label: 'Imprimir Caja',
      icon: 'fas fa-print',
      iconStyle: { 'color': '#DC4C64' },
      command: () => {
        this.cajaService.printPdfArqueoCaja(this.totalMovements()!.id_caja_small);
      }
    },
    {
      label: 'Monto Inicial',
      icon: 'fa-solid fa-pencil',
      iconStyle: { 'color': '#e8630a' },
      command: () => {
        this.cajaService.showModalOpenCaja = true;
        this.cajaService.type_event = 'UPDATE_CAJA';
      }
    },
    {
      label: 'Cerrar Caja',
      icon: 'fa-solid fa-shop-lock',
      iconStyle: { 'color': '#1e7e4e' },
      command: () => {
        this.cajaService.showModalOpenCaja = true;
        this.cajaService.type_event = 'CLOSE_CAJA';
      }
    }
  ]);

  moveList = signal<MenuItem[]>([
    {
      label: 'Nuevo Gasto',
      icon: 'fa-solid fa-money-bill-1-wave',
      iconStyle: { 'color': '#3b82f6' },
      command: () => {
        this.cajaService.showModalMovementCaja = true;
        this.cajaService.type_movement = 'GASTO';
      }
    },
    {
      label: 'Nuevo Ingreso',
      icon: 'fa-solid fa-reply',
      iconStyle: { 'color': '#1e7e4e' },
      command: () => {
        this.cajaService.showModalMovementCaja = true;
        this.cajaService.type_movement = 'INGRESO';
      }
    }
  ]);

  // ── Columnas ─────────────────────────────────────────────
  cols = signal<ColsTable[]>([
    {
      field: 'description',
      header: 'DESCRIPCIÓN',
      style: 'min-width:200px;',
      tooltip: true
    },
    {
      field: 'monto',
      header: 'MONTO',
      style: 'min-width:180px; max-width:180px;',
      tooltip: true,
      isTag: true,
      tagValue: (val: number) => this.pipeNumber.transform(val, this.decimal()),
      tagColor: (_val: number) => 'primary',
      tagIcon:  (_val: number) => 'fa-solid fa-sack-dollar'
    }
  ]);

  searchFor = signal<SearchFor[]>([
    { name: 'CÓDIGO',      code: 'cod' },
    { name: 'NUMBER DOC.', code: 'registry_number' },
    { name: 'COMENTARIOS', code: 'comments' },
    { name: 'BALANZA',     code: 'scale.name' },
    { name: 'USUARIO',     code: 'user.full_names' }
  ]);

  // ── Lifecycle ────────────────────────────────────────────
  ngOnInit(): void {
    this._resetCharts();
    this.getAllTotalesMovements();
  }

  ngOnDestroy(): void {}

  // ── Métodos públicos ──────────────────────────────────────
  getAllTotalesMovements(): void {
    this.loading.set(true);
    this.totalMovements.set(undefined);
    this._resetCharts();

    this.cajaService.getTotalesAndMovements(this.validatorsService.id_sucursal()).subscribe({
      next: (resp) => {
        this.totalMovements.set(resp);
        this.movementsTable.set({ data: resp.ingresos });
        this.ingresos.set(resp.ingresos);
        this.gastos.set(resp.gastos);
        this._buildCharts(resp);
      },
      complete: () => this.loading.set(false),
      error:    () => this.loading.set(false)
    });
  }

  postOpenCaja(type: 'cash' | 'bank' = 'cash'): void {
    this.cajaService.showModalOpenCaja = true;
    this.cajaService.type_event = 'OPEN_CAJA';
  }

  switchMode(mode: 'efectivo' | 'banco'): void {
    if (mode === this.chartMode) return;
    this.animating = true;
    this.loading.set(true);
    setTimeout(() => {
      this.chartMode = mode;
      this.loading.set(false);
      this.animating = false;
    }, 500);
  }

  reload(): void {
    this.getAllTotalesMovements();
  }

  // ── Métodos privados ──────────────────────────────────────
  private _buildCharts(m: GetAllTotalesMovements): void {
    this.dataEfectivo = {
      labels: ['Monto Inicial', 'Ingresos', 'Gastos'],
      datasets: [{
        data: [m.monto_apertura ?? 0, m.total_ingresos ?? 0, m.total_gastos ?? 0],
        backgroundColor:      ['#93c5fd', '#86efac', '#fca5a5'],
        hoverBackgroundColor: ['#60a5fa', '#4ade80', '#f87171'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    };
    const any = m as any;
    this.dataBanco = {
      labels: ['Ingresos Transf.', 'Gastos Transf.'],
      datasets: [{
        data: [any.total_ingresos_transferencia ?? 0, any.total_gastos_transferencia ?? 0],
        backgroundColor:      ['#6ee7b7', '#fdba74'],
        hoverBackgroundColor: ['#34d399', '#fb923c'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    };
  }

  private _resetCharts(): void {
    this.dataEfectivo = {
      labels: ['Monto Inicial', 'Ingresos', 'Gastos'],
      datasets: [{ data: [0, 0, 0], backgroundColor: ['#93c5fd', '#86efac', '#fca5a5'] }]
    };
    this.dataBanco = {
      labels: ['Ingresos Transf.', 'Gastos Transf.'],
      datasets: [{ data: [0, 0], backgroundColor: ['#6ee7b7', '#fdba74'] }]
    };
  }

// ── Nuevas propiedades estáticas del modal (solo UI) ──
selectedCash = false;
selectedBank = false;
activeTab: 'cash' | 'bank' = 'cash';

cashAmount = 0;
cashObservacion = '';
bankAmount = 0;
numeroCuenta = '64645';
estadoCuenta: 'activa' | 'inactiva' | 'pendiente' = 'activa';

bancoOptions = [
  { label: 'BNB — Banco Nacional Bolivia', value: 'bnb' },
  { label: 'BCB — Banco Unión', value: 'bcb' },
  { label: 'BCP — Banco Crédito', value: 'bcp' },
];
selectedBanco = this.bancoOptions[0];

// Toggle selección de tarjetas
toggleType(type: 'cash' | 'bank') {
  if (type === 'cash') {
    this.selectedCash = !this.selectedCash;
    if (!this.selectedBank) this.activeTab = 'cash';
  } else {
    this.selectedBank = !this.selectedBank;
    if (!this.selectedCash) this.activeTab = 'bank';
    else this.activeTab = 'bank';
  }
}

// Método combinado (llama al existente dos veces)
postOpenCajaBoth() {
  this.postOpenCaja('cash');
  // El segundo se puede encadenar según tu lógica existente
  this.postOpenCaja('bank');
}

}
