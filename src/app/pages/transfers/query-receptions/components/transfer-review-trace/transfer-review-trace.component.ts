import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AssignableReviewUser,
  ReviewDetail,
  ReviewStatus,
  TransferTraceability,
  TransferReview,
  TransferReviewService,
} from 'src/app/services/transfer-review.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';
import { Product } from 'src/app/pages/inventories/interfaces/products.interface';
import { ProductAccessContext } from 'src/app/core/constants/product-category-access.constants';
import Swal from 'sweetalert2';

interface DocumentRequirement {
  type?: string;
  label: string;
  options?: Array<{ label: string; value: string }>;
}

interface ReconciliationCase {
  label: string;
  value: string;
  action: string;
  references: DocumentRequirement[];
  shortageOnly?: boolean;
}

interface NoteNotice {
  noteId: number;
  type: 'success' | 'error';
  text: string;
}

type SelectableProduct = Product & { display_name: string };

const SCALE_TICKET = { type: 'TICKET_BALANZA', label: 'Ticket de balanza' };

@Component({
  selector: 'app-transfer-review-trace',
  templateUrl: './transfer-review-trace.component.html',
  styleUrls: ['../../../../../layouts/transfer-review-alert/transfer-review-alert.component.scss'],
})
export class TransferReviewTraceComponent {
  @Output() readonly reviewChanged = new EventEmitter<void>();

  readonly reviewService = inject(TransferReviewService);
  readonly validatorsService = inject(ValidatorsService);
  readonly productsService = inject(ProductsService);
  private readonly fb = inject(FormBuilder);

  readonly selectedNote = signal<TransferReview | null>(null);
  readonly selectedDetail = signal<ReviewDetail | null>(null);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly automaticPreview = signal<any | null>(null);
  readonly previewLoading = signal(false);
  readonly targetProductsLoading = signal(false);
  readonly targetProducts = signal<SelectableProduct[]>([]);
  readonly noteNotice = signal<NoteNotice | null>(null);
  readonly assignmentNoteId = signal<number | null>(null);
  readonly assignmentSaving = signal(false);
  readonly assignmentError = signal('');

  readonly reconciliationCases: ReconciliationCase[] = [
    {
      label: 'Diferencia de peso entre balanzas',
      value: 'DIFERENCIA_BALANZAS',
      action: 'Primero realice la clasificación o el traslado que regulariza los kilos. Después registre su número para que el sistema lo verifique.',
      references: [],
    },
    {
      label: 'Material incorrecto o no corresponde',
      value: 'MATERIAL_INCORRECTO',
      action: 'Identificar el producto real y referenciar la clasificación que documenta el cambio.',
      references: [{ type: 'NOTA_CLASIFICACION', label: 'Nota de clasificación' }],
    },
    {
      label: 'Discrepancia física versus sistema',
      value: 'DISCREPANCIA_FISICO_SISTEMA',
      action: 'Documentar si existe físico sin registro o registro sin físico y vincular el acta de regularización.',
      references: [{ type: 'ACTA_REGULARIZACION', label: 'Acta de regularización' }],
    },
    {
      label: 'Error en el peso registrado',
      value: 'ERROR_PESO_REGISTRADO',
      action: 'Referenciar la nota corregida o complementaria y el pesaje físico que sustenta la diferencia.',
      references: [SCALE_TICKET],
    },
    {
      label: 'Pérdida o extravío en traslado',
      value: 'PERDIDA_TRANSITO',
      action: 'Documentar los kg netos recibidos y vincular el acta de incidencia para la gestión posterior.',
      references: [{ type: 'ACTA_INCIDENCIA', label: 'Acta de incidencia o siniestro' }],
      shortageOnly: true,
    },
    {
      label: 'Error de digitación o carga',
      value: 'ERROR_DIGITACION',
      action: 'Vincular la nota original y la nota corregida para dejar constancia de la sustitución documental.',
      references: [
        { type: 'NOTA_CORREGIDA', label: 'Nota corregida' },
      ],
    },
  ];

  readonly documentaryForm = this.fb.group({
    reason_code: ['', Validators.required],
    operational_justification: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    id_authorizer_user: [null as number | null, Validators.required],
    solution_code: ['', Validators.required],
    id_target_product: [null as number | null],
    document_references: this.fb.array([]),
    resolve_partial: [false],
    quantity: [null as number | null],
  });

  readonly assignmentForm = this.fb.group({
    id_assigned_user: [null as number | null, Validators.required],
    assignment_observation: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  });

  get documentReferences(): FormArray {
    return this.documentaryForm.controls.document_references;
  }

  documentReferenceControls(): FormGroup[] {
    return this.documentReferences.controls as FormGroup[];
  }

  statusLabel(status: ReviewStatus): string {
    return ({ EN_REVISION: 'Pendiente', PARCIAL: 'Parcial', COMPLETADO: 'Cerrada' })[status];
  }

  statusSeverity(status: ReviewStatus): 'danger' | 'warning' | 'success' {
    return ({ EN_REVISION: 'danger', PARCIAL: 'warning', COMPLETADO: 'success' } as const)[status];
  }

  differenceLabel(type: string): string {
    return type === 'EXCEDENTE_PARA_REVISION' ? 'Excedente' : 'Faltante';
  }

  irregularityLabel(direction: string): string {
    return direction === 'STOCK_GREATER_THAN_KARDEX'
      ? 'El stock físico es mayor que el Kardex'
      : 'El Kardex es mayor que el stock físico';
  }

  pendingDetailsCount(note: TransferReview): number {
    return note.details.filter(({ reconciliation_status }) => reconciliation_status !== 'COMPLETADO').length;
  }

  historyActionLabel(value: string): string {
    return ({ CONFIRM_DIFFERENCE: 'Confirmación sin movimiento adicional', TRANSFER_RETURN: 'Devolución al origen',
      CLASSIFY_EXCESS: 'Clasificación de excedente', CLASSIFY_SHORTAGE: 'Clasificación de faltante',
      TRANSFER: 'Traslado', CLASSIFIED: 'Clasificación', CONFIRMATION: 'Confirmación',
      ACTIVE: 'Activa', REVERSED: 'Revertida', REVERSAL_PENDING: 'Reversión pendiente',
      PENDING_RECEPTION: 'Pendiente de recepción', MANUAL_INTERVENTION_REQUIRED: 'Requiere gestión manual',
    } as Record<string, string>)[value] || value.replace(/_/g, ' ') || 'Sin estado registrado';
  }

  visibleReviewNotes(notes: TransferTraceability['reviewNotes']): TransferTraceability['reviewNotes'] {
    const focusedId = this.reviewService.focusedReviewNoteId();
    return focusedId ? notes.filter(({ id }) => id === focusedId) : notes;
  }

  remainingQuantity(detail: ReviewDetail): number {
    return Math.max(0, Number(detail.quantity_difference) - Number(detail.quantity_resolved || 0));
  }

  retainedQuantity(detail: ReviewDetail): number {
    return (detail.inventoryHolds || [])
      .filter(({ disposition }) => disposition !== 'LIBERADO_POR_AJUSTE')
      .reduce((total, hold) => total + Number(hold.quantity), 0);
  }

  cases(noteType: string): ReconciliationCase[] {
    const previewReasons = this.automaticPreview()?.reasons;
    if (Array.isArray(previewReasons)) {
      return previewReasons.map((reason: any) => ({
        label: reason.label,
        value: reason.code,
        action: '',
        references: (reason.required_references || []).map((type: string) => ({ type, label: this.documentTypeLabel(type) })),
      }));
    }
    const isShortage = noteType !== 'EXCEDENTE_PARA_REVISION';
    return this.reconciliationCases.filter(({ shortageOnly }) => !shortageOnly || isShortage);
  }

  selectedCase(noteType: string): ReconciliationCase | undefined {
    const reasonCode = this.documentaryForm.controls.reason_code.value;
    return this.cases(noteType).find(({ value }) => value === reasonCode);
  }

  operationalRequirement(noteType: string): DocumentRequirement {
    const isExcess = noteType === 'EXCEDENTE_PARA_REVISION';
    return {
      label: 'Regularización realizada',
      options: [
        { label: 'Clasificación a merma', value: 'NOTA_CLASIFICACION_MERMA' },
        isExcess
          ? { label: 'Traslado de devolución al almacén de origen', value: 'NOTA_TRASLADO_ORIGEN' }
          : { label: 'Traslado complementario desde el almacén de origen', value: 'NOTA_TRASLADO_COMPLEMENTARIO' },
      ],
    };
  }

  authorizers(): AssignableReviewUser[] {
    return this.reviewService.assignableUsers().filter(({ can_authorize }) => can_authorize === true);
  }

  setVisibility(visible: boolean): void {
    this.reviewService.setTraceVisibility(visible);
    if (!visible) {
      this.cancelDocumentaryClose();
      this.cancelAssignment();
    }
  }

  beginAssignment(note: TransferReview): void {
    this.assignmentNoteId.set(note.id);
    this.assignmentError.set('');
    this.assignmentForm.reset({
      id_assigned_user: note.assignedUser?.id || null,
      assignment_observation: '',
    });
  }

  cancelAssignment(): void {
    this.assignmentNoteId.set(null);
    this.assignmentError.set('');
    this.assignmentForm.reset();
  }

  assignReview(note: TransferReview): void {
    const userId = this.assignmentForm.controls.id_assigned_user.value;
    const observation = this.assignmentForm.controls.assignment_observation.value?.trim() || '';
    if (!userId || observation.length < 5) {
      this.assignmentForm.markAllAsTouched();
      this.assignmentError.set('Seleccione el responsable y escriba una observación de al menos 5 caracteres.');
      return;
    }

    this.assignmentError.set('');
    this.assignmentSaving.set(true);
    this.reviewService.assign(note.id, userId, observation).pipe(
      finalize(() => this.assignmentSaving.set(false)),
    ).subscribe({
      next: () => {
        const assigned = this.reviewService.assignableUsers().find(({ id }) => id === userId);
        this.noteNotice.set({ noteId: note.id, type: 'success', text: `Tarea derivada a ${assigned?.full_names || 'el responsable seleccionado'}.` });
        this.cancelAssignment();
      },
      error: (error: any) => this.assignmentError.set(this.apiError(error, 'No se pudo derivar la tarea.')),
    });
  }

  selectDocumentaryClose(note: TransferReview, detail: ReviewDetail): void {
    this.selectedNote.set(note);
    this.selectedDetail.set(detail);
    this.formError.set('');
    this.documentReferences.clear();
    this.documentaryForm.reset({
      reason_code: '',
      operational_justification: '',
      id_authorizer_user: null,
      solution_code: '',
      id_target_product: null,
      resolve_partial: false,
      quantity: this.remainingQuantity(detail),
    });
    this.automaticPreview.set(null);
    this.previewLoading.set(true);
    this.reviewService.previewAutomaticResolution(note.id, detail.id).pipe(
      finalize(() => this.previewLoading.set(false)),
    ).subscribe({
      next: (preview) => {
        this.automaticPreview.set(preview);
        if (preview?.status === 'ALREADY_RECONCILED') {
          this.formError.set('Ya se registró esta conciliación. Actualice la lista para ver el registro existente.');
        } else if (preview?.status === 'PENDING_OPERATION') {
          this.formError.set('Ya se registró el traslado correctivo y está pendiente de recepción. No debe volver a conciliarlo.');
        } else if (preview?.status === 'REQUIRES_MANUAL') {
          this.formError.set(preview.message || 'Ya se registró una operación, pero falta conciliar manualmente su estado.');
        }
      },
      error: (error: any) => this.formError.set(this.apiError(error, 'No se pudo preparar la conciliación automática.')),
    });
  }

  onReasonChange(noteType: string): void {
    this.formError.set('');
    this.documentaryForm.controls.solution_code.setValue('');
    this.documentaryForm.controls.id_target_product.setValue(null);
    this.targetProducts.set([]);
    this.onSolutionChange();
    this.documentReferences.clear();
    const selected = this.selectedCase(noteType);
    for (const reference of selected?.references || []) {
      this.documentReferences.push(this.fb.group({
        document_type: [reference.type || '', Validators.required],
        document_number: ['', [Validators.required, Validators.maxLength(100)]],
        document_date: [new Date().toISOString().slice(0, 10), Validators.required],
      }));
    }
    const solutions = this.availableSolutions();
    if (solutions.length === 1) {
      this.documentaryForm.controls.solution_code.setValue(solutions[0].code);
      this.onSolutionChange();
    }
  }

  onSolutionChange(): void {
    const targetProduct = this.documentaryForm.controls.id_target_product;
    const solution = this.selectedAutomaticSolution();
    if (solution?.requires_target_product) {
      targetProduct.setValidators([Validators.required, Validators.min(1)]);
      this.loadTargetProducts();
    } else {
      targetProduct.clearValidators();
      targetProduct.setValue(null);
      this.targetProducts.set([]);
    }
    targetProduct.updateValueAndValidity();
  }

  selectedAutomaticSolution(): any | null {
    const code = this.documentaryForm.controls.solution_code.value;
    return (this.automaticPreview()?.solutions || []).find((solution: any) => solution.code === code) || null;
  }

  availableSolutions(): any[] {
    const reasonCode = this.documentaryForm.controls.reason_code.value;
    const reason = (this.automaticPreview()?.reasons || []).find(({ code }: any) => code === reasonCode);
    if (!reason) return [];
    return (this.automaticPreview()?.solutions || []).filter(({ code }: any) => reason.solution_codes.includes(code));
  }

  selectedAuthorizer(): AssignableReviewUser | undefined {
    const id = this.documentaryForm.controls.id_authorizer_user.value;
    return this.authorizers().find((user) => user.id === id);
  }

  onPartialChange(): void {
    const quantity = this.documentaryForm.controls.quantity;
    if (this.documentaryForm.controls.resolve_partial.value) {
      const maximum = this.selectedDetail() ? this.remainingQuantity(this.selectedDetail()!) : 0;
      quantity.setValidators([Validators.required, Validators.min(0.0001), Validators.max(maximum)]);
    } else {
      quantity.clearValidators();
      quantity.setValue(this.selectedDetail() ? this.remainingQuantity(this.selectedDetail()!) : null);
    }
    quantity.updateValueAndValidity();
  }

  private loadTargetProducts(): void {
    if (this.targetProductsLoading() || this.targetProducts().length) return;
    this.targetProductsLoading.set(true);
    this.productsService.getSelectProducts('', 1000, '', '', ProductAccessContext.Classifieds).pipe(
      finalize(() => this.targetProductsLoading.set(false)),
    ).subscribe({
      next: (response: any) => {
        const sourceProductId = Number(this.selectedAutomaticSolution()?.product_id);
        this.targetProducts.set((response?.products || [])
          .filter((product: Product) => Number(product.id) !== sourceProductId)
          .map((product: Product) => ({ ...product, display_name: `${product.cod} - ${product.name}` })));
      },
      error: (error: any) => this.formError.set(this.apiError(error, 'No se pudo cargar el catálogo de productos para clasificar.')),
    });
  }

  cancelDocumentaryClose(): void {
    this.selectedNote.set(null);
    this.selectedDetail.set(null);
    this.formError.set('');
    this.documentReferences.clear();
    this.documentaryForm.reset();
    this.automaticPreview.set(null);
    this.targetProducts.set([]);
  }

  async confirmDocumentaryClose(note: TransferReview): Promise<void> {
    const detail = this.selectedDetail();
    const form = this.documentaryForm.getRawValue();
    const pending = detail ? this.remainingQuantity(detail) : 0;
    const quantity = form.resolve_partial ? Number(form.quantity) : pending;

    if (!detail || this.documentaryForm.invalid || quantity <= 0 || quantity - pending > 0.0001) {
      this.documentaryForm.markAllAsTouched();
      this.formError.set('Complete los campos marcados y verifique la cantidad antes de confirmar.');
      return;
    }

    const solution = this.selectedAutomaticSolution();
    const authorizer = this.selectedAuthorizer();
    const reconciliationDialog = document.querySelector('.transfer-review-trace-dialog') as HTMLElement | null;
    const confirmation = await Swal.fire({
      target: reconciliationDialog || document.body,
      icon: solution?.operation_type === 'CONFIRMATION' ? 'warning' : 'question',
      title: solution?.operation_type === 'CONFIRMATION' ? '¿Confirmar sin movimiento?' : '¿Crear operación y conciliar?',
      html: `<p>${solution?.warning || 'Revise los datos antes de continuar.'}</p><p><b>Autoriza:</b> ${authorizer?.full_names || ''}</p>`,
      showCancelButton: true,
      confirmButtonText: solution?.operation_type === 'CONFIRMATION' ? 'Sí, confirmar diferencia' : 'Sí, crear y conciliar',
      cancelButtonText: 'Volver a revisar',
      confirmButtonColor: solution?.operation_type === 'CONFIRMATION' ? '#b45309' : '#166534',
      customClass: { container: 'sweetalert2 reconciliation-confirmation' },
      allowOutsideClick: false,
      returnFocus: true,
    });
    if (!confirmation.isConfirmed) return;

    this.formError.set('');
    this.saving.set(true);
    this.reviewService.confirmAutomaticResolution(note.id, detail.id, {
      solution_code: form.solution_code || '',
      id_target_product: form.id_target_product,
      reason_code: form.reason_code,
      operational_justification: form.operational_justification?.trim(),
      document_references: form.document_references,
      id_authorizer_user: form.id_authorizer_user,
      detail_version: this.automaticPreview()?.detail_version,
      quantity,
    }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (result: any) => {
        const pendingQuantity = Number(result?.pending_quantity || 0);
        const operation = result?.operation;
        const text = operation?.type === 'CONFIRMATION'
          ? 'Diferencia confirmada. Se conservó el producto registrado sin crear movimientos adicionales.'
          : pendingQuantity > 0
          ? `${operation?.type || 'Operación'} ${operation?.code || ''} creada. Quedan ${pendingQuantity.toFixed(4)} pendientes.`
          : `${operation?.type || 'Operación'} ${operation?.code || ''} creada con stock, Kardex e historial. La diferencia quedó conciliada.`;
        this.noteNotice.set({
          noteId: note.id,
          type: 'success',
          text,
        });
        this.reviewChanged.emit();
        this.cancelDocumentaryClose();
      },
      error: (error: any) => {
        const message = this.apiError(error, 'No se pudo guardar la conciliación.');
        const alreadyRegistered = /ya (fue conciliado|se registr[oó]|existe)|duplic/i.test(message);
        const requiresManual = /stock|permiso|configuraci[oó]n|no admite|requiere/i.test(message);
        this.formError.set(alreadyRegistered
          ? 'Ya se registró esta conciliación. Actualice la lista para ver el registro existente.'
          : requiresManual
            ? `Falta conciliar manualmente. ${message}`
            : message);
      },
    });
  }

  eventLabel(eventType: string): string {
    return ({
      SIN_AJUSTE_INVENTARIO: 'Regularización verificada',
      CERRADA_DOCUMENTALMENTE: 'Revisión cerrada automáticamente',
      ASIGNADA_AUTOMATICAMENTE: 'Responsable asignado automáticamente',
      ASIGNADA: 'Tarea derivada a responsable',
      CREADA: 'Boleta de revisión creada',
    } as Record<string, string>)[eventType] || eventType.replaceAll('_', ' ');
  }

  reasonLabel(reasonCode: string): string {
    return this.reconciliationCases.find(({ value }) => value === reasonCode)?.label || reasonCode.replaceAll('_', ' ');
  }

  documentTypeLabel(documentType: string): string {
    const operationalLabels: Record<string, string> = {
      NOTA_CLASIFICACION_MERMA: 'Clasificación a merma',
      NOTA_TRASLADO_ORIGEN: 'Traslado de devolución al origen',
      NOTA_TRASLADO_COMPLEMENTARIO: 'Traslado complementario',
    };
    if (operationalLabels[documentType]) return operationalLabels[documentType];
    for (const reference of this.reconciliationCases.flatMap(({ references }) => references)) {
      if (reference.type === documentType) return reference.label;
      const option = reference.options?.find(({ value }) => value === documentType);
      if (option) return option.label;
    }
    return documentType.replaceAll('_', ' ');
  }

  private apiError(error: any, fallback: string): string {
    return error?.error?.errors?.[0]?.msg || error?.error?.msg || fallback;
  }
}
