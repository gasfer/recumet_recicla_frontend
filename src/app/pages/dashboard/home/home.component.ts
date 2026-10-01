import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { Histories, History } from '../interfaces/history.interface';
import { DashboardService } from '../services/dashboard.service';
import { ValidatorsService } from 'src/app/services/validators.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  authService       = inject(AuthService);
  dashboardService  = inject(DashboardService);
  validatorsService = inject(ValidatorsService);
  private router = inject(Router);
  searchTerm = '';
  cardsRequest = signal([
    {
      class: 'card r-card', icon: 'fa-solid fa-tags',
      view: this.validatorsService.withPermission('PRODUCTOS','view'),
      title: 'PRODUCTOS', subtitle: 'Catálogo y precios', linkRedirect: '/inventories/products',
    },
    {
      class: 'card bookp-card', icon: 'fa-solid fa-truck',
      view: this.validatorsService.withPermission('COMPRAS','create'),
      title: 'COMPRAS', subtitle: 'Ingreso por báscula', linkRedirect: '/inputs/input-small',
    }, {
      class: 'card revenue-card', icon: 'fa-solid fa-boxes-stacked',
      view: this.validatorsService.withPermission('CLASIFICADOS','create'),
      title: 'CLASIFICADOS', subtitle: 'Tipos de material', linkRedirect: '/classifieds/classified',
    },
    {
      class: 'card o-card', icon: 'fa-solid fa-users',
      view: this.validatorsService.withPermission('CLIENTES','view'),
      title: 'CLIENTES', subtitle: 'Compradores finales', linkRedirect: '/outputs/clients',
    },
    {
      class: 'card b-card', icon: 'fa-solid fa-cart-plus',
      view: this.validatorsService.withPermission('VENTAS','create'),
      title: 'VENTAS', subtitle: 'Despacho de material', linkRedirect: '/outputs/output',
    },
    {
      class: 'card p-card', icon: 'fa-solid fa-signs-post',
      view: this.validatorsService.withPermission('TRASLADOS','create'),
      title: 'TRASLADOS', subtitle: 'Entre sucursales', linkRedirect: '/transfers/transfer',
    },
    {
      class: 'card o-card', icon: 'fa-solid fa-cash-register',
      view: this.validatorsService.withPermission('CAJA','view'),
      title: 'CAJA', subtitle: 'Flujo de efectivo', linkRedirect: '/caja/adm-caja',
    },
    {
      class: 'card p-card', icon: 'fas fa-clipboard-list',
      view: this.validatorsService.withPermission('KARDEX-FIS','view'),
      title: 'INVENTARIO', subtitle: 'Stock en patios', linkRedirect: '/inventories/kardex-fisico/mp',
    },

  ]);
  cardsRequestPermission = computed(()=>this.cardsRequest().filter(resp => resp.view == true))
  histories    = signal<Histories|undefined>(undefined);
  loading      = signal(false);
  filteredHistories(): History[] {
    const search = this.searchTerm.trim().toLocaleLowerCase();
    const entries = this.histories()?.data ?? [];
    if (!search) return entries.slice(0, 12);
    return entries.filter(history => [history.description, history.type, history.user?.full_names]
      .some(value => value?.toLocaleLowerCase().includes(search))).slice(0, 12);
  }
  totalEvents = computed(() => this.histories()?.total ?? this.histories()?.data.length ?? 0);
  todayEvents = computed(() => (this.histories()?.data ?? []).filter(history => {
    const date = new Date(history.createdAt); const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length);
  purchaseEvents = computed(() => (this.histories()?.data ?? []).filter(history =>
    `${history.type} ${history.description}`.toLocaleLowerCase().includes('compra')).length);
  activeUsers = computed(() => new Set((this.histories()?.data ?? []).map(history => history.user?.full_names).filter(Boolean)).size);

  ngOnInit(): void {
    const id_user = this.authService.getUser.role == 'ADMINISTRADOR' ? '' : this.authService.getUser.id!.toString();
    this.loading.set(true);
    this.dashboardService.getAll(1,5000,this.validatorsService.id_sucursal(),id_user).subscribe({
      next: (resp) => {
        this.loading.set(false);
        this.histories.set(resp.histories);
      },
      error: () => this.loading.set(false)
    });
  }

  clearSearch(): void { this.searchTerm = ''; }

  initials(name?: string): string {
    return (name ?? 'SR').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  }

  operationClass(type?: string): string {
    const label = (type ?? '').toLocaleLowerCase();
    if (label.includes('compra')) return 'is-purchase';
    if (label.includes('venta')) return 'is-sale';
    return label.includes('edit') || label.includes('modific') ? 'is-edit' : '';
  }

  openHistory(history: History): void {
    if (history.module === 'COMPRAS') this.router.navigate(['/inputs/input-small']);
    else if (history.module === 'VENTAS') this.router.navigate(['/outputs/output']);
  }

  exportReport(): void {
    const rows = (this.histories()?.data ?? []).map(history => [history.createdAt, history.description, history.type, history.user?.full_names ?? 'Sistema']);
    const csv = [['Fecha', 'Detalle', 'Operación', 'Responsable'], ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'recumet-operaciones.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
