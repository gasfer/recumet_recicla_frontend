import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { Sucursal } from 'src/app/pages/managements/interfaces/sucursales.interface';
import { SucursalesService } from 'src/app/pages/managements/services/sucursales.service';
import { KardexService } from '../services/kardex.service';
import { ReconciliationUser, StockReconciliationCase, StockReconciliationFilters, StockReconciliationPreview, StockReconciliationStrategy } from '../interfaces/stock-reconciliation.interface';

@Component({ selector: 'app-stock-diagnostic', templateUrl: './stock-diagnostic.component.html', styleUrls: ['./stock-diagnostic.component.scss'] })
export class StockDiagnosticComponent implements OnInit {
  private fb = inject(FormBuilder);
  private kardexService = inject(KardexService);
  private sucursalService = inject(SucursalesService);
  readonly authService = inject(AuthService);
  readonly validatorsService = inject(ValidatorsService);
  loading = signal(false);
  saving = signal(false);
  cases = signal<StockReconciliationCase[]>([]);
  total = signal(0);
  dropdownSucursales = signal<Sucursal[]>([]);
  filteredStorages = signal<any[]>([]);
  selectedCase = signal<StockReconciliationCase | null>(null);
  preview = signal<StockReconciliationPreview | null>(null);
  authorizers = signal<ReconciliationUser[]>([]);
  countResponsibles = signal<ReconciliationUser[]>([]);
  showInvestigation = signal(false);
  detectionSummary = signal<{ detected: number; created: number } | null>(null);
  expanded = new Set<number>();

  readonly strategies: Array<{ value: StockReconciliationStrategy; label: string }> = [
    { value: 'AJUSTAR_AMBOS_AL_CONTEO_FISICO', label: 'Igualar Stock y Kardex al conteo físico' },
    { value: 'REGISTRAR_KARDEX_OMITIDO', label: 'Registrar movimiento Kardex omitido' },
    { value: 'AJUSTAR_STOCK_POR_CONTEO', label: 'Ajustar Stock según conteo físico' },
    { value: 'VINCULAR_REGULARIZACION_EXISTENTE', label: 'Vincular una regularización ya realizada' },
    { value: 'CONTINUAR_INVESTIGACION', label: 'Continuar investigación sin cambiar saldos' },
  ];
  formFilter: FormGroup = this.fb.group({
    id_sucursal: [this.validatorsService.id_sucursal() || ''], id_storage: [this.validatorsService.id_storage() || ''],
    status: [''], direction: [''], query: [''],
  });
  formInvestigation: FormGroup = this.fb.group({
    physical_count: [null], cause: ['', Validators.minLength(5)], notes: ['', Validators.minLength(10)],
    strategy: ['AJUSTAR_AMBOS_AL_CONTEO_FISICO', Validators.required], assigned_user_id: [null, Validators.required], authorized_user_id: [null],
  });

  ngOnInit(): void {
    this.formInvestigation.valueChanges.subscribe(() => this.preview.set(null));
    this.getSucursales();
    this.loadCases(true);
  }
  get canInvestigate(): boolean { return this.validatorsService.withPermission('STOCK_RECONCILIATION', 'create'); }
  get canRegularize(): boolean { return this.validatorsService.withPermission('STOCK_RECONCILIATION', 'update'); }
  get openCases(): number { return this.cases().filter(item => item.status !== 'RESUELTA').length; }
  get differenceTotal(): number { return this.cases().filter(item => item.status !== 'RESUELTA').reduce((sum, item) => sum + Math.abs(Number(item.difference_observed)), 0); }

  getSucursales(): void {
    this.sucursalService.getAllAndSearch(1, 100, true).subscribe(({ sucursales }) => {
      let list = sucursales.data;
      if (this.authService.getUser?.role !== 'ADMINISTRADOR') {
        list = list.filter((sucursal: Sucursal) => this.authService.getUser?.assign_sucursales?.some(item => item.id_sucursal === sucursal.id));
      }
      this.dropdownSucursales.set(list);
      this.refreshStorages();
    });
  }
  refreshStorages(): void {
    const branch = this.dropdownSucursales().find(item => item.id === Number(this.formFilter.value.id_sucursal));
    this.filteredStorages.set(branch?.storage || []);
  }
  onSucursalChange(): void { this.formFilter.patchValue({ id_storage: '' }); this.refreshStorages(); }

  loadCases(detect = false): void {
    const filters = this.filters();
    if (!filters.id_sucursal) { Swal.fire('Seleccione una sucursal', 'El diagnóstico se realiza dentro de una sucursal autorizada.', 'info'); return; }
    this.loading.set(true);
    const request = detect
      ? this.kardexService.detectReconciliationCases({ id_sucursal: filters.id_sucursal, id_storage: filters.id_storage }).pipe(
        switchMap((result) => {
          this.detectionSummary.set({
            detected: Number(result?.detected || 0),
            created: Number(result?.created || 0),
          });
          return this.kardexService.getReconciliationCases(filters);
        }),
      )
      : this.kardexService.getReconciliationCases(filters);
    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ cases }: any) => {
        this.cases.set(cases.data.map((item: any) => ({ ...item, physical_stock_observed: Number(item.physical_stock_observed), kardex_balance_observed: Number(item.kardex_balance_observed), difference_observed: Number(item.difference_observed) })));
        this.total.set(cases.total);
      },
      error: err => Swal.fire('No se pudo cargar', err.error?.errors?.[0]?.msg || 'Revise los permisos y vuelva a intentar.', 'error'),
    });
  }
  private filters(): StockReconciliationFilters {
    const value = this.formFilter.value;
    return { page: 1, limit: 100, id_sucursal: value.id_sucursal || undefined, id_storage: value.id_storage || undefined, status: value.status || undefined, direction: value.direction || undefined, query: value.query || undefined };
  }
  directionLabel(item: StockReconciliationCase): string {
    return item.direction === 'STOCK_MAYOR_QUE_KARDEX'
      ? 'Stock mayor: falta movimiento en Kardex o sobra existencia física'
      : 'Kardex mayor: falta Stock físico o existe un movimiento sin respaldo físico';
  }
  toggleCandidates(id: number): void { this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id); }

  investigate(item: StockReconciliationCase): void {
    this.selectedCase.set(item); this.preview.set(null); this.authorizers.set([]); this.countResponsibles.set([]);
    this.formInvestigation.reset({ physical_count: item.physical_count ?? null, cause: item.cause || '', notes: item.investigation_notes || '', strategy: item.selected_strategy || 'AJUSTAR_AMBOS_AL_CONTEO_FISICO', assigned_user_id: item.assignedUser?.id ?? null, authorized_user_id: null });
    this.kardexService.getReconciliationCountResponsibles(item.id_sucursal).subscribe({ next: ({ users }) => this.countResponsibles.set(users), error: () => this.countResponsibles.set([]) });
    this.showInvestigation.set(true);
  }
  saveInvestigation(): void {
    const item = this.selectedCase(); if (!item) return;
    const value = this.formInvestigation.value;
    this.saving.set(true);
    this.kardexService.investigateReconciliationCase(item.id, {
      physical_count: value.physical_count, cause: value.cause, notes: value.notes, strategy: value.strategy,
      assigned_user_id: value.assigned_user_id,
      evidences: [{ evidence_type: 'CONTEO_FISICO', reference: `CONTEO FÍSICO ${value.physical_count}`, description: value.notes }],
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: ({ case: updated }) => {
        this.selectedCase.set(updated); this.loadCases(false);
        if (updated.status === 'LISTA_PARA_REGULARIZAR') this.loadPreview(updated);
        else Swal.fire('Seguimiento guardado', 'No se modificó ningún saldo de inventario.', 'success');
      },
      error: err => Swal.fire('Datos incompletos', err.error?.errors?.[0]?.msg || 'Revise la investigación.', 'warning'),
    });
  }
  private loadPreview(item: StockReconciliationCase): void {
    this.kardexService.previewReconciliationCase(item.id).subscribe({
      next: ({ preview }) => {
        this.preview.set(preview);
        if (this.canRegularize) this.kardexService.getReconciliationAuthorizers(item.id_sucursal).subscribe(({ users }) => this.authorizers.set(users));
      },
      error: err => Swal.fire('No se puede previsualizar', err.error?.errors?.[0]?.msg || 'Los saldos pudieron cambiar.', 'warning'),
    });
  }
  confirmResolution(): void {
    const item = this.selectedCase(); const resultPreview = this.preview(); const authorizer = Number(this.formInvestigation.value.authorized_user_id);
    if (!item || !resultPreview || !authorizer) { Swal.fire('Falta autorización', 'Seleccione al usuario que autoriza esta regularización.', 'info'); return; }
    Swal.fire({ title: `Confirmar ${resultPreview.registry_number || 'regularización individual'}`, html: `<b>${resultPreview.effect_label}</b><br>Stock: ${resultPreview.stock_before} → ${resultPreview.stock_after}<br>Kardex: ${resultPreview.kardex_before} → ${resultPreview.kardex_after}`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar' }).then(result => {
      if (!result.isConfirmed) return;
      const key = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${item.id}`;
      this.saving.set(true);
      this.kardexService.resolveReconciliationCase(item.id, { authorized_user_id: authorizer, idempotency_key: key }).pipe(finalize(() => this.saving.set(false))).subscribe({
        next: () => { this.showInvestigation.set(false); Swal.fire('Caso verificado', 'La diferencia final fue comprobada y la trazabilidad quedó registrada.', 'success'); this.loadCases(true); },
        error: err => Swal.fire('No se regularizó', err.error?.errors?.[0]?.msg || 'Revise el caso antes de confirmar.', 'error'),
      });
    });
  }
  clearFilters(): void { this.formFilter.patchValue({ status: '', direction: '', query: '' }); this.loadCases(false); }
}
