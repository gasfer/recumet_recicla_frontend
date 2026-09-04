import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ValidatorsService } from './validators.service';
import { NotificationsService } from './notifications.service';

export type ReviewStatus = 'EN_REVISION' | 'PARCIAL' | 'COMPLETADO';

export interface ReviewProduct { id: number; cod: string; name: string; }
export interface StockKardexIrregularity {
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
  difference_direction: 'STOCK_GREATER_THAN_KARDEX' | 'KARDEX_GREATER_THAN_STOCK';
  traceable_transfers: Array<{
    transfer_id: number;
    transfer_cod: string;
    review_note_id?: number | null;
    review_note_registry?: string | null;
    review_note_status?: ReviewStatus | null;
  }>;
}
export interface AssignableReviewUser { id: number; full_names: string; role: string; can_authorize?: boolean; }
export interface ReviewDetail {
  id: number;
  quantity_sent: string;
  quantity_received: string;
  quantity_difference: string;
  quantity_resolved: string;
  reconciliation_status: 'EN_REVISION' | 'COMPLETADO';
  cause?: string;
  product: ReviewProduct;
  inventoryHolds?: Array<{
    id: number;
    quantity: string;
    disposition: 'EN_REVISION' | 'RETENIDO_SIN_AJUSTE' | 'LIBERADO_POR_AJUSTE';
  }>;
  resolutionActions?: Array<{
    id: number; strategy: string; quantity: string; operation_mode?: string;
    operation_type?: string; operation_id?: number; operation_status?: string;
    movementLinks?: Array<{ id_kardex_movement: number; movement_role?: string }>;
  }>;
}
export interface TransferReview {
  id: number;
  registry_number: string;
  type: string;
  date: string;
  reconciliation_status: ReviewStatus;
  management_status: 'ACTIVA' | 'REVERTIDA' | 'ELIMINADA';
  management_reason?: string | null;
  pending_items: number;
  age_days: number;
  id_transfer: number;
  resolved_at?: string | null;
  registeredProduct?: ReviewProduct;
  assignedUser?: { id: number; full_names: string };
  transfer: {
    id: number;
    cod: string;
    sucursal_send: { id: number; name: string };
    sucursal_received: { id: number; name: string };
  };
  details: ReviewDetail[];
  evidences?: Array<{ id: number; evidence_type: string; description?: string; file_url?: string; createdAt: string }>;
}
export interface ReconciliationGroup {
  id_transfer: number;
  date: string;
  transfer: TransferReview['transfer'];
  reconciliations: TransferReview[];
}
export interface ReconciliationPage { data: ReconciliationGroup[]; total: number; page: number; limit: number; }
export interface TransferTraceability {
  id: number;
  cod: string;
  date_send: string;
  date_received: string | null;
  status: string;
  sucursal_send: { name: string };
  sucursal_received: { id: number; name: string };
  storage_send: { name: string };
  storage_received: { name: string };
  user_send: { full_names: string };
  user_received: { full_names: string } | null;
  detailsTransfers: Array<{
    id: number;
    quantity: string;
    quantity_received: string;
    observation?: string;
    product: ReviewProduct;
  }>;
  reviewNotes: Array<TransferReview & {
    registeredProduct: ReviewProduct;
    events: Array<{
      id: number;
      event_type: string;
      description: string;
      metadata?: {
        action_type?: string;
        detail_id?: number;
        reference_type?: string;
        reference_code?: string;
        id_product?: number;
        inventory_effect?: 'NONE' | 'VERIFIED_EXISTING_OPERATION';
        operational_verification?: boolean;
        operational_document_type?: string;
        operational_document_id?: number;
        operational_document_number?: string;
        operational_document_quantity?: number;
        note_or_reference?: string;
        reason_code?: string;
        disposition?: string;
        document_references?: Array<{ document_type: string; document_number: string; document_date: string }>;
        operational_justification?: string;
        executor_user_id?: number;
        authorizer_user_id?: number;
        assigned_user_id?: number;
        assignment_observation?: string;
      };
      createdAt: string;
      user: { full_names: string };
    }>;
    evidences: Array<{ id: number; evidence_type: string; description?: string; file_url?: string; createdAt: string }>;
    resolutionActions: Array<{ id: number; strategy: string; quantity: string; observations?: string; createdAt: string;
      user?: { full_names: string }; approvedUser?: { full_names: string }; operation_type?: string; operation_id?: number;
      operation_status?: string; reversal_reason?: string; movementLinks?: Array<{ kardexMovement?: { type: string; quantity: string; details: string } }> }>;
  }>;
  stock_kardex_irregularities: StockKardexIrregularity[];
}

interface OpenReviewContext {
  reviews: TransferReview[];
  stock_kardex_irregularities: StockKardexIrregularity[];
}

const baseUrl = environment.base_url;

@Injectable({ providedIn: 'root' })
export class TransferReviewService {
  private readonly http = inject(HttpClient);
  private readonly validators = inject(ValidatorsService);
  private readonly notifications = inject(NotificationsService);
  private readonly contextCache = new Map<string, OpenReviewContext>();
  private readonly dismissedReviewIdsByContext = new Map<string, Set<number>>();
  private readonly dismissedIrregularitiesByContext = new Map<string, Set<string>>();
  private activeContextKey = '';

  readonly contextReady = signal(false);
  readonly loading = signal(false);
  readonly openReviews = signal<TransferReview[]>([]);
  readonly stockKardexIrregularities = signal<StockKardexIrregularity[]>([]);
  readonly showAlertDialog = signal(false);
  readonly showTraceDialog = signal(false);
  readonly historyOnly = signal(false);
  readonly traceLoading = signal(false);
  readonly traceability = signal<TransferTraceability | null>(null);
  readonly focusedReviewNoteId = signal<number | null>(null);
  readonly assignableUsers = signal<AssignableReviewUser[]>([]);
  readonly assigneesLoading = signal(false);

  constructor() {
    this.notifications.transferReviewUpdates$.subscribe((event) => {
      if (event?.type !== 'TRANSFER_REVIEW_OVERDUE' && Number(event?.sucursal_id) === this.validators.id_sucursal()) {
        this.checkCurrentContext(true).subscribe();
      }
    });
  }

  checkCurrentContext(force = false): Observable<TransferReview[]> {
    if (!this.validators.withPermission('TRANSFER_REVIEW', 'view')) {
      this.contextCache.clear();
      this.activeContextKey = '';
      this.openReviews.set([]);
      this.stockKardexIrregularities.set([]);
      this.showAlertDialog.set(false);
      this.loading.set(false);
      this.contextReady.set(true);
      return of([]);
    }
    const idSucursal = this.validators.id_sucursal();
    const idStorage = this.validators.id_storage();
    if (!idSucursal || !idStorage) {
      this.contextReady.set(true);
      return of([]);
    }
    const key = `${idSucursal}:${idStorage}`;
    this.activeContextKey = key;
    const cached = this.contextCache.get(key);
    if (!force && cached) {
      this.applyOpenContext(cached, key);
      this.contextReady.set(true);
      return of(cached.reviews);
    }
    this.contextReady.set(false);
    this.loading.set(true);
    const params = new HttpParams().set('id_sucursal', idSucursal).set('id_storage', idStorage);
    return this.http.get<{ ok: boolean; reviews: TransferReview[]; stock_kardex_irregularities?: StockKardexIrregularity[] }>(`${baseUrl}/transfer-review-notes/open`, { params }).pipe(
      map(({ reviews, stock_kardex_irregularities = [] }) => ({ reviews, stock_kardex_irregularities })),
      tap((context) => {
        this.contextCache.set(key, context);
        this.applyOpenContext(context, key);
      }),
      map(({ reviews }) => reviews),
      catchError(() => {
        this.openReviews.set([]);
        this.stockKardexIrregularities.set([]);
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        this.contextReady.set(true);
      }),
    );
  }

  openTrace(transferId: number, reviewNoteId: number | null = null, historyOnly = false): void {
    this.historyOnly.set(historyOnly);
    this.showAlertDialog.set(false);
    this.focusedReviewNoteId.set(reviewNoteId);
    this.showTraceDialog.set(true);
    this.traceLoading.set(true);
    this.traceability.set(null);
    this.http.get<{ ok: boolean; traceability: TransferTraceability }>(`${baseUrl}/transfer-review-notes/transfer/${transferId}/traceability`).pipe(
      finalize(() => this.traceLoading.set(false)),
    ).subscribe({
      next: ({ traceability }) => {
        this.traceability.set(traceability);
        setTimeout(() => {
          const content = document.querySelector('.transfer-review-trace-dialog .p-dialog-content');
          if (content) content.scrollTop = 0;
        });
        if (!historyOnly) this.loadAssignableUsers(traceability.sucursal_received.id).subscribe();
      },
      error: () => this.showTraceDialog.set(false),
    });
  }

  assign(noteId: number, userId: number, observation: string): Observable<unknown> {
    return this.http.put(`${baseUrl}/transfer-review-notes/${noteId}/assign`, {
      id_assigned_user: userId,
      assignment_observation: observation,
    }).pipe(
      tap(() => this.refreshCurrentTrace()),
    );
  }

  loadAssignableUsers(idSucursal: number): Observable<AssignableReviewUser[]> {
    this.assigneesLoading.set(true);
    const params = new HttpParams().set('id_sucursal', idSucursal);
    return this.http.get<{ ok: boolean; users: AssignableReviewUser[] }>(`${baseUrl}/transfer-review-notes/assignees`, { params }).pipe(
      map(({ users }) => users),
      tap((users) => this.assignableUsers.set(users)),
      catchError(() => {
        this.assignableUsers.set([]);
        return of([]);
      }),
      finalize(() => this.assigneesLoading.set(false)),
    );
  }

  addComment(noteId: number, description: string): Observable<unknown> {
    return this.http.post(`${baseUrl}/transfer-review-notes/${noteId}/comments`, { description }).pipe(
      tap(() => this.refreshCurrentTrace()),
    );
  }

  addManualAction(noteId: number, action: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${baseUrl}/transfer-review-notes/${noteId}/actions`, action).pipe(
      tap(() => this.refreshCurrentTrace()),
    );
  }

  addEvidence(noteId: number, evidence: { evidence_type: string; description?: string; file_url?: string }): Observable<unknown> {
    return this.http.post(`${baseUrl}/transfer-review-notes/${noteId}/evidences`, evidence).pipe(
      tap(() => this.refreshCurrentTrace()),
    );
  }

  resolveDetail(noteId: number, detailId: number, payload: Record<string, unknown>): Observable<unknown> {
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return this.http.post(`${baseUrl}/transfer-review-notes/${noteId}/details/${detailId}/resolve`, payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }).pipe(tap(() => {
      this.refreshCurrentTrace();
      this.checkCurrentContext(true).subscribe();
    }));
  }

  documentaryCloseDetail(noteId: number, detailId: number, payload: Record<string, unknown>): Observable<unknown> {
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requestPayload = { ...payload, idempotency_key: idempotencyKey };
    return this.http.post(`${baseUrl}/transfer-review-notes/${noteId}/details/${detailId}/documentary-close`, requestPayload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }).pipe(tap(() => {
      this.refreshCurrentTrace();
      this.checkCurrentContext(true).subscribe();
    }));
  }

  previewAutomaticResolution(noteId: number, detailId: number): Observable<any> {
    return this.http.get<{ ok: boolean; preview: any }>(`${baseUrl}/transfer-review-notes/${noteId}/details/${detailId}/automatic-preview`)
      .pipe(map(({ preview }) => preview));
  }

  confirmAutomaticResolution(noteId: number, detailId: number, payload: Record<string, unknown>): Observable<unknown> {
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return this.http.post(`${baseUrl}/transfer-review-notes/${noteId}/details/${detailId}/automatic-resolve`, {
      ...payload, idempotency_key: idempotencyKey,
    }, { headers: { 'Idempotency-Key': idempotencyKey } }).pipe(tap(() => {
      this.refreshCurrentTrace();
      this.checkCurrentContext(true).subscribe();
    }));
  }

  listReconciliations(filters: Record<string, string | number | undefined>): Observable<ReconciliationPage> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<{ ok: boolean; reconciliations: ReconciliationPage | { data: TransferReview[]; total: number; page: number; limit: number } }>(`${baseUrl}/transfer-review-notes/management`, { params })
      .pipe(map(({ reconciliations }) => this.normalizeReconciliationGroups(reconciliations)));
  }

  private normalizeReconciliationGroups(
    page: ReconciliationPage | { data: TransferReview[]; total: number; page: number; limit: number },
  ): ReconciliationPage {
    if (page.data.length === 0 || 'reconciliations' in page.data[0]) return page as ReconciliationPage;
    const notes = page.data as TransferReview[];
    const data = [...notes.reduce((groups, note) => {
      const current = groups.get(note.id_transfer);
      if (current) {
        current.reconciliations.push(note);
        return groups;
      }
      groups.set(note.id_transfer, {
        id_transfer: note.id_transfer,
        date: note.date,
        transfer: note.transfer,
        reconciliations: [note],
      });
      return groups;
    }, new Map<number, ReconciliationGroup>()).values()];
    return { ...page, data, total: data.length };
  }

  reverseReconciliation(noteId: number, reason: string): Observable<{ msg: string }> {
    return this.http.put<{ msg: string }>(`${baseUrl}/transfer-review-notes/${noteId}/reverse`, { reason });
  }

  deleteReconciliation(noteId: number, reason: string): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(`${baseUrl}/transfer-review-notes/${noteId}`, { body: { reason } });
  }

  closeReview(noteId: number): Observable<unknown> {
    return this.http.put(`${baseUrl}/transfer-review-notes/${noteId}/close`, {}).pipe(tap(() => {
      this.refreshCurrentTrace();
      this.checkCurrentContext(true).subscribe();
    }));
  }

  closeAlerts(): void {
    if (this.activeContextKey) {
      this.dismissedReviewIdsByContext.set(this.activeContextKey, new Set(this.openReviews().map(({ id }) => id)));
      this.dismissedIrregularitiesByContext.set(
        this.activeContextKey,
        new Set(this.stockKardexIrregularities().map((item) => this.irregularityKey(item))),
      );
    }
    this.showAlertDialog.set(false);
  }

  beginSession(): void {
    this.dismissedReviewIdsByContext.clear();
    this.dismissedIrregularitiesByContext.clear();
    this.showAlertDialog.set(false);
  }

  setAlertVisibility(visible: boolean): void {
    if (!visible) {
      this.closeAlerts();
      return;
    }
    this.showAlertDialog.set(this.openReviews().length > 0 || this.stockKardexIrregularities().length > 0);
  }

  setTraceVisibility(visible: boolean): void {
    this.showTraceDialog.set(visible);
    if (!visible) this.focusedReviewNoteId.set(null);
  }

  private applyOpenContext(context: OpenReviewContext, contextKey: string): void {
    const { reviews, stock_kardex_irregularities: irregularities } = context;
    this.openReviews.set(reviews);
    this.stockKardexIrregularities.set(irregularities);
    if (reviews.length === 0 && irregularities.length === 0) {
      this.dismissedReviewIdsByContext.delete(contextKey);
      this.dismissedIrregularitiesByContext.delete(contextKey);
      this.showAlertDialog.set(false);
      return;
    }

    const dismissedIds = this.dismissedReviewIdsByContext.get(contextKey) || new Set<number>();
    const dismissedIrregularities = this.dismissedIrregularitiesByContext.get(contextKey) || new Set<string>();
    this.showAlertDialog.set(
      reviews.some(({ id }) => !dismissedIds.has(id))
      || irregularities.some((item) => !dismissedIrregularities.has(this.irregularityKey(item))),
    );
  }

  private irregularityKey(item: StockKardexIrregularity): string {
    return `${item.id_product}:${item.id_sucursal}:${item.id_storage}:${item.physical_kardex_difference}`;
  }

  private refreshCurrentTrace(): void {
    const transferId = this.traceability()?.id;
    if (transferId) this.openTrace(transferId, this.focusedReviewNoteId());
  }
}
