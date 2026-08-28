import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { KardexService } from '../services/kardex.service';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { AuthService } from 'src/app/auth/auth.service';
import Swal from 'sweetalert2';

export interface DiagnosticItem {
  cod: string;
  name: string;
  id_product: number;
  id_sucursal: number;
  id_storage: number;
  physical_stock: number;
  stock_in_review: number;
  available_stock: number;
  kardex_balance: number;
  physical_kardex_difference: number;
  traceable_transfers?: any[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-stock-diagnostic',
  templateUrl: './stock-diagnostic.component.html',
  styleUrls: ['./stock-diagnostic.component.scss']
})
export class StockDiagnosticComponent implements OnInit {
  Math = Math;
  private fb = inject(FormBuilder);
  private kardexService = inject(KardexService);
  private sucursalService = inject(SucursalesService);
  public authService = inject(AuthService);

  loading = signal<boolean>(false);
  syncing = signal<boolean>(false);
  diagnosticList = signal<DiagnosticItem[]>([]);
  dropdownSucursales = signal<Sucursal[]>([]);
  filteredStorages = signal<any[]>([]);

  formFilter: FormGroup = this.fb.group({
    id_sucursal: [''],
    id_storage: [''],
    onlyDiscrepancies: [true]
  });

  ngOnInit(): void {
    this.getSucursales();
    this.loadDiagnostic();
  }

  getSucursales(): void {
    this.sucursalService.getAllAndSearch(1, 100, true).subscribe({
      next: (resp) => {
        let list = resp.sucursales.data;
        if (this.authService.getUser?.role !== 'ADMINISTRADOR') {
          list = list.filter((sucursal: Sucursal) =>
            this.authService.getUser?.assign_sucursales!.some((res) => sucursal.id === res.id_sucursal)
          );
        }
        this.dropdownSucursales.set(list);
      },
      error: (err) => {
        console.error('Error cargando sucursales:', err);
      }
    });
  }

  onSucursalChange(): void {
    const selectedId = Number(this.formFilter.get('id_sucursal')?.value);
    const allSucursales = this.dropdownSucursales();
    const found = allSucursales.find(s => s.id === selectedId);
    this.filteredStorages.set(found?.storage || []);
    this.formFilter.patchValue({ id_storage: '' });
  }

  loadDiagnostic(): void {
    this.loading.set(true);
    const { id_sucursal, id_storage } = this.formFilter.value;
    
    this.kardexService.getStockDiagnostic({
      id_sucursal: id_sucursal || undefined,
      id_storage: id_storage || undefined,
      limit: 1000
    }).subscribe({
      next: (resp) => {
        const data: DiagnosticItem[] = (resp.diagnostic || []).map((item: any) => ({
          ...item,
          physical_stock: Number(item.physical_stock),
          stock_in_review: Number(item.stock_in_review),
          available_stock: Number(item.available_stock),
          kardex_balance: Number(item.kardex_balance),
          physical_kardex_difference: Number(item.physical_kardex_difference),
          isExpanded: false
        }));
        this.diagnosticList.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener diagnóstico:', err);
        this.loading.set(false);
        Swal.fire('Error', 'No se pudo cargar el diagnóstico de stock.', 'error');
      }
    });
  }

  get filteredList(): DiagnosticItem[] {
    const onlyDisc = this.formFilter.get('onlyDiscrepancies')?.value;
    const list = this.diagnosticList();
    if (!onlyDisc) return list;
    return list.filter(item => Math.abs(item.physical_kardex_difference) > 0.0001);
  }

  get countDiscrepancies(): number {
    return this.diagnosticList().filter(item => Math.abs(item.physical_kardex_difference) > 0.0001).length;
  }

  get totalDiffSum(): number {
    return this.diagnosticList().reduce((sum, item) => sum + Math.abs(item.physical_kardex_difference), 0);
  }

  toggleExpand(item: DiagnosticItem): void {
    item.isExpanded = !item.isExpanded;
  }

  getSeverityBadge(item: DiagnosticItem): { label: string; class: string } {
    const diff = Math.abs(item.physical_kardex_difference);
    if (diff <= 0.0001) {
      return { label: 'SINCRONIZADO', class: 'bg-success text-white' };
    }
    const maxVal = Math.max(Math.abs(item.physical_stock), Math.abs(item.kardex_balance), 1);
    const pct = (diff / maxVal) * 100;
    if (pct < 1) {
      return { label: `DESFASE LEVE (${diff.toFixed(2)})`, class: 'bg-warning text-dark' };
    }
    return { label: `DESFASE CRÍTICO (${diff.toFixed(2)})`, class: 'bg-danger text-white' };
  }

  syncStocks(): void {
    const count = this.countDiscrepancies;
    if (count === 0) {
      Swal.fire('Información', 'Todos los stocks están actualmente sincronizados con el Kardex.', 'info');
      return;
    }

    Swal.fire({
      title: '¿Sincronizar Stock con Kardex?',
      html: `Se actualizará el stock de <b>${count} productos</b> en la base de datos igualándolos al último saldo inmutable de la vista Kardex.<br><br><span class="text-danger">Esta acción registrará la operación en el Historial del sistema.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, Sincronizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeSync();
      }
    });
  }

  private executeSync(): void {
    this.syncing.set(true);
    const { id_sucursal, id_storage } = this.formFilter.value;

    Swal.fire({
      title: 'Sincronizando Stock...',
      text: 'Espere por favor mientras se actualizan los datos',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.kardexService.syncStocksFromKardex({
      id_sucursal: id_sucursal || undefined,
      id_storage: id_storage || undefined
    }).subscribe({
      next: (resp) => {
        this.syncing.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Sincronización Completada',
          text: `Se corregieron exitosamente ${resp.synced || 0} productos.`
        });
        this.loadDiagnostic();
      },
      error: (err) => {
        this.syncing.set(false);
        console.error('Error al sincronizar:', err);
        Swal.fire('Error', err.error?.errors?.[0]?.msg || 'Ocurrió un error durante la sincronización', 'error');
      }
    });
  }

  clearFilters(): void {
    this.formFilter.patchValue({
      id_sucursal: '',
      id_storage: '',
      onlyDiscrepancies: true
    });
    this.filteredStorages.set([]);
    this.loadDiagnostic();
  }
}
