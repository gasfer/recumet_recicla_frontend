import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { ReconciliationGroup, TransferReview, TransferReviewService } from 'src/app/services/transfer-review.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { TransfersService } from '../services/transfers.service';
import { ClassifiedService } from '../../classifieds/services/classified.service';

@Component({
  selector: 'app-reconciliations',
  templateUrl: './reconciliations.component.html',
  styleUrls: ['./reconciliations.component.scss'],
})
export class ReconciliationsComponent implements OnInit, OnDestroy {
  readonly reviewService = inject(TransferReviewService);
  readonly validators = inject(ValidatorsService);
  private readonly notifications = inject(NotificationsService);
  private readonly transfersService = inject(TransfersService);
  private readonly classifiedService = inject(ClassifiedService);
  private readonly updates = new Subscription();

  readonly rows = signal<ReconciliationGroup[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly processingNoteId = signal<number | null>(null);
  readonly pageSize = signal(25);
  query = '';
  status = '';
  dateFrom = '';
  dateTo = '';
  readonly statuses = [
    { label: 'Todos los estados', value: '' },
    { label: 'Activa', value: 'ACTIVA' },
    { label: 'Revertida', value: 'REVERTIDA' },
    { label: 'Eliminada (auditoría)', value: 'ELIMINADA' },
  ];

  ngOnInit(): void {
    this.load(1);
    this.updates.add(this.notifications.transferReviewUpdates$.subscribe(() => this.load(1)));
  }

  ngOnDestroy(): void { this.updates.unsubscribe(); }

  load(page: number): void {
    this.loading.set(true);
    this.reviewService.listReconciliations({
      page,
      limit: this.pageSize(),
      query: this.query.trim(),
      status: this.status,
      date_from: this.dateFrom,
      date_to: this.dateTo,
      id_sucursal: this.validators.id_sucursal(),
    }).subscribe({
      next: (result) => { this.rows.set(result.data); this.total.set(result.total); },
      error: (error) => { this.loading.set(false); this.showError(error, 'No se pudo cargar la lista de conciliaciones.'); },
      complete: () => this.loading.set(false),
    });
  }

  paginate(event: { first?: number | null; rows?: number | null }): void {
    const size = Number(event.rows) || this.pageSize();
    this.pageSize.set(size);
    this.load(Math.floor((Number(event.first) || 0) / size) + 1);
  }

  clearFilters(): void {
    this.query = ''; this.status = ''; this.dateFrom = ''; this.dateTo = '';
    this.load(1);
  }

  preview(note: TransferReview): void { this.reviewService.openTrace(note.id_transfer, note.id); }

  previewGroup(group: ReconciliationGroup): void { this.reviewService.openTrace(group.id_transfer); }

  automaticOperations(note: TransferReview): Array<any> {
    return note.details.flatMap(({ resolutionActions }) => resolutionActions || [])
      .filter(({ operation_mode, operation_id }) => operation_mode === 'CREATED_AUTOMATICALLY' && operation_id);
  }

  totalDifference(note: TransferReview): number {
    return note.details.reduce((total, detail) => total + Number(detail.quantity_difference || 0), 0);
  }

  printOperation(operation: any): void {
    if (operation.operation_type === 'TRANSFER') this.transfersService.printPdfReport(Number(operation.operation_id));
    else if (operation.operation_type === 'CLASSIFIED') this.classifiedService.printPdfReport(Number(operation.operation_id));
  }

  async reverse(note: TransferReview): Promise<void> {
    const reason = await this.requestReason(
      'Revertir conciliación',
      'Se anularán los documentos automáticos y se crearán movimientos Kardex compensatorios. La diferencia y sus alertas volverán a revisión.',
      'Revertir conciliación',
    );
    if (!reason) return;
    this.loading.set(true);
    this.processingNoteId.set(note.id);
    this.reviewService.reverseReconciliation(note.id, reason).pipe(
      finalize(() => this.processingNoteId.set(null)),
    ).subscribe({
      next: ({ msg }) => { void Swal.fire('Conciliación revertida', msg, 'success'); this.load(1); },
      error: (error) => { this.loading.set(false); this.showError(error, 'No se pudo revertir la conciliación.'); },
    });
  }

  async remove(note: TransferReview): Promise<void> {
    const reason = await this.requestReason(
      'Eliminar conciliación',
      'Esta acción la quitará de la operación normal, pero conservará el expediente para auditoría. Solo se permite después de revertirla.',
      'Eliminar de la operación',
    );
    if (!reason) return;
    this.loading.set(true);
    this.processingNoteId.set(note.id);
    this.reviewService.deleteReconciliation(note.id, reason).pipe(
      finalize(() => this.processingNoteId.set(null)),
    ).subscribe({
      next: ({ msg }) => { void Swal.fire('Conciliación eliminada', msg, 'success'); this.load(1); },
      error: (error) => { this.loading.set(false); this.showError(error, 'No se pudo eliminar la conciliación.'); },
    });
  }

  statusSeverity(status: string): 'success' | 'warning' | 'danger' {
    return status === 'ACTIVA' ? 'success' : status === 'REVERTIDA' ? 'warning' : 'danger';
  }

  reconciliationStatusLabel(note: TransferReview): string {
    if (note.management_status === 'REVERTIDA') return 'Revertida';
    if (note.management_status === 'ELIMINADA') return 'Eliminada';
    return ({ EN_REVISION: 'En revisión', PARCIAL: 'Parcial', COMPLETADO: 'Completada' } as Record<string, string>)[note.reconciliation_status] || note.reconciliation_status;
  }

  reconciliationStatusSeverity(note: TransferReview): 'success' | 'warning' | 'danger' {
    if (note.management_status === 'ELIMINADA') return 'danger';
    if (note.management_status === 'REVERTIDA' || note.reconciliation_status !== 'COMPLETADO') return 'warning';
    return 'success';
  }

  private async requestReason(title: string, warning: string, confirmButtonText: string): Promise<string | null> {
    const result = await Swal.fire({
      title,
      html: `<p>${warning}</p><p><b>Revise la previsualización antes de continuar.</b></p>`,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo obligatorio',
      inputPlaceholder: 'Explique el motivo (mínimo 10 caracteres)',
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91c1c',
      inputValidator: (value) => String(value || '').trim().length < 10 ? 'Ingrese un motivo de al menos 10 caracteres.' : undefined,
    });
    return result.isConfirmed ? String(result.value).trim() : null;
  }

  private showError(error: any, fallback: string): void {
    const message = error?.error?.errors?.[0]?.msg || fallback;
    void Swal.fire('Atención', message, 'error');
  }
}
