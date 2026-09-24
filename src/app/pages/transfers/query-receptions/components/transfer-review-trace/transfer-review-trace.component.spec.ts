import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { TransferReviewTraceComponent } from './transfer-review-trace.component';
import { TransferReviewService } from 'src/app/services/transfer-review.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ProductsService } from 'src/app/pages/inventories/services/products.service';

describe('TransferReviewTraceComponent dynamic reconciliation form', () => {
  let component: TransferReviewTraceComponent;
  let reviewServiceMock: any;

  beforeEach(() => {
    reviewServiceMock = {
      assignableUsers: signal([]),
      focusedReviewNoteId: signal(null),
      traceability: signal({ id: 44 }),
      setTraceVisibility: () => undefined,
      previewHistoricalDifference: () => of({
        fingerprint: 'preview-1',
        action: { code: 'REGISTRAR_EXCEDENTE_OMITIDO', label: 'Registrar excedente de 10.0000 kg', quantity: 10 },
        product: { id: 5, cod: 'P-5', name: 'Producto 5' },
        inventory: { before_stock: 110, before_kardex: 100, after_stock: 110, after_kardex: 110 },
        allocations: [],
      }),
      previewBulkResolution: (noteId: number, detailIds: number[]) => of({
        note_id: noteId,
        ready: true,
        items: detailIds.map((detail_id) => ({ detail_id, preview: { status: 'READY' } })),
      }),
      previewAutomaticResolution: () => of({
        status: 'READY', pending_quantity: 6, reasons: [], solutions: [],
        verification: {
          status: 'SIN_REGISTRO_ACTIVO', is_blocked: false, message: 'Listo',
          transfer: { id: 44, number: 'TRAS00044', registry_number: null },
          difference: { detail_id: 4, type: 'EXCEDENTE', product: null, quantity_expected: 6 },
          registration: {
            note_number: null, note_assigned_on_confirmation: true, product: null,
            location: { id_sucursal: 2, id_storage: 20, sucursal: 'Casa Matriz', storage: 'Principal' },
            quantity_registered: 0, quantity_pending: 6, actions: [], movements: [],
          },
          inventory: null,
        },
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ValidatorsService, useValue: {} },
        { provide: ProductsService, useValue: {
          getSelectProducts: () => of({ products: [] }),
          getDifferenceProducts: () => of({ products: [{ id: 22, cod: 'MP-MER-001', name: 'Merma traslado' }] }),
        } },
        { provide: TransferReviewService, useValue: reviewServiceMock },
      ],
    });
    component = TestBed.runInInjectionContext(() => new TransferReviewTraceComponent());
    component.selectedDetail.set({
      id: 4, quantity_difference: 8, quantity_resolved: 2,
    } as any);
    component.automaticPreview.set({
      status: 'READY',
      pending_quantity: 6,
      verification: {
        status: 'SIN_REGISTRO_ACTIVO', is_blocked: false, message: 'Listo',
        transfer: { id: 44, number: 'TRAS00044', registry_number: null },
        difference: { detail_id: 4, type: 'EXCEDENTE', product: null, quantity_expected: 6 },
        registration: {
          note_number: null, note_assigned_on_confirmation: true, product: null,
          location: { id_sucursal: 2, id_storage: 20, sucursal: 'Casa Matriz', storage: 'Principal' },
          quantity_registered: 0, quantity_pending: 6, actions: [], movements: [],
        },
        inventory: null,
      },
      reasons: [
        { code: 'MATERIAL_INCORRECTO', label: 'Material incorrecto', solution_codes: ['CLASSIFY_EXCESS'], required_references: ['NOTA_CLASIFICACION'] },
        { code: 'DIFERENCIA_BALANZAS', label: 'Diferencia de balanzas', solution_codes: ['CONFIRM_DIFFERENCE', 'TRANSFER_RETURN'], required_references: [] },
      ],
      solutions: [
        { code: 'CLASSIFY_EXCESS', requires_target_product: true, product_id: 5 },
        { code: 'CONFIRM_DIFFERENCE', requires_target_product: false },
        { code: 'TRANSFER_RETURN', requires_target_product: false },
      ],
    });
  });

  it('expone los cuatro estados de verificación y bloquea el registro existente', () => {
    expect(component.registrationVerificationLabel('SIN_REGISTRO_ACTIVO')).toBe('Sin registro vigente');
    expect(component.registrationVerificationLabel('REGISTRO_EXISTENTE')).toBe('Registro existente');
    expect(component.registrationVerificationLabel('REGISTRO_PARCIAL')).toBe('Registro parcial existente');
    expect(component.registrationVerificationLabel('EVIDENCIA_AMBIGUA')).toBe('Evidencia ambigua');

    component.automaticPreview.update((preview: any) => ({
      ...preview,
      verification: {
        ...preview.verification,
        status: 'REGISTRO_EXISTENTE',
        is_blocked: true,
        transfer: { ...preview.verification.transfer, number: 'TRAS00044' },
        registration: {
          ...preview.verification.registration,
          note_number: 'NTR-00091',
          quantity_registered: 6,
          quantity_pending: 0,
        },
      },
    }));

    const verification = component.automaticPreview()?.verification;
    expect(verification?.is_blocked).toBeTrue();
    expect(verification?.transfer.number).toBe('TRAS00044');
    expect(verification?.registration.note_number).toBe('NTR-00091');
  });

  it('8.3 limpia valores condicionales y recalcula soluciones al cambiar motivo', () => {
    component.documentaryForm.patchValue({ reason_code: 'MATERIAL_INCORRECTO', id_target_product: 9 });
    component.onReasonChange('EXCEDENTE_PARA_REVISION');

    expect(component.documentaryForm.controls.solution_code.value).toBe('CLASSIFY_EXCESS');
    expect(component.documentaryForm.controls.id_target_product.hasValidator).toBeDefined();
    expect(component.documentReferences.length).toBe(1);

    component.documentaryForm.patchValue({ reason_code: 'DIFERENCIA_BALANZAS', id_target_product: 9 });
    component.onReasonChange('EXCEDENTE_PARA_REVISION');

    expect(component.documentaryForm.controls.solution_code.value).toBe('');
    expect(component.documentaryForm.controls.id_target_product.value).toBeNull();
    expect(component.documentReferences.length).toBe(0);
    expect(component.availableSolutions().map(({ code }) => code)).toEqual(['CONFIRM_DIFFERENCE', 'TRANSFER_RETURN']);
  });

  it('8.3 exige una cantidad parcial positiva y no mayor al remanente', () => {
    component.documentaryForm.controls.resolve_partial.setValue(true);
    component.onPartialChange();
    const quantity = component.documentaryForm.controls.quantity;

    quantity.setValue(0);
    expect(quantity.hasError('min')).toBeTrue();
    quantity.setValue(7);
    expect(quantity.hasError('max')).toBeTrue();
    quantity.setValue(4.5);
    expect(quantity.valid).toBeTrue();

    component.documentaryForm.controls.resolve_partial.setValue(false);
    component.onPartialChange();
    expect(quantity.value).toBe(6);
  });

  it('prevalida los detalles seleccionados antes de abrir la conciliación agrupada', () => {
    const note: any = {
      id: 31,
      details: [
        { id: 4, reconciliation_status: 'EN_REVISION', quantity_difference: 8, quantity_resolved: 2 },
        { id: 5, reconciliation_status: 'EN_REVISION', quantity_difference: 3, quantity_resolved: 0 },
        { id: 6, reconciliation_status: 'COMPLETADO', quantity_difference: 1, quantity_resolved: 1 },
      ],
    };
    component.toggleAllDetails(note, true);
    component.beginBulkReconciliation(note);

    expect(component.selectedDetailIds()).toEqual([4, 5]);
    expect(component.bulkPreview()?.ready).toBeTrue();
    expect(component.selectedDetail()?.id).toBe(4);
  });

  it('muestra sólo la acción de excedente autorizada por el servidor y carga su previsualización', () => {
    const item: any = {
      id: 1,
      difference_type: 'EXCEDENTE',
      reconciliation_status: 'EXCEDENTE_PENDIENTE_KARDEX',
      registered_product: { id: 5, cod: 'P-5', name: 'Producto 5' },
      allowed_action: {
        code: 'REGISTRAR_EXCEDENTE_OMITIDO',
        label: 'Registrar excedente de 10.0000 kg',
        quantity: 10,
        requires_merma_product: false,
      },
    };
    component.beginHistoricalCompletion(item);
    expect(component.historicalSelectedItem()).toBe(item);
    expect(component.historicalPreview()?.fingerprint).toBe('preview-1');
    expect(component.historicalStatusLabel(item)).toContain('Registrar excedente');
  });

  it('exige seleccionar MERMAS antes de previsualizar un faltante histórico', () => {
    const item: any = {
      id: 2,
      difference_type: 'FALTANTE',
      reconciliation_status: 'FALTANTE_PENDIENTE_MERMA',
      registered_product: null,
      allowed_action: {
        code: 'REGISTRAR_FALTANTE_OMITIDO',
        label: 'Registrar faltante de 7.0000 kg en Merma traslado',
        quantity: 7,
        requires_merma_product: true,
      },
    };
    component.beginHistoricalCompletion(item);
    expect(component.historicalCompletionForm.controls.id_merma_product.hasError('required')).toBeTrue();
    expect(component.historicalMermaProducts()[0].cod).toBe('MP-MER-001');
    expect(component.historicalPreview()).toBeNull();
  });

  it('identifica los faltantes secundarios incluidos en un registro consolidado', () => {
    const item: any = {
      difference_type: 'FALTANTE',
      reconciliation_status: 'FALTANTE_PENDIENTE_MERMA',
      difference_pending: 3.5,
      allowed_action: null,
    };

    expect(component.historicalStatusLabel(item)).toBe('Incluido en registro consolidado');
  });

  it('5.2 expone y procesa detalles de trazabilidad con cantidades normales, bloqueadas y estados de liberación', () => {
    const mockTrace: any = {
      id: 99,
      status: 'RECEIVED',
      detailsTransfers: [
        {
          id: 1,
          quantity_sent: 100,
          quantity_physical_received: 100.5,
          quantity_normal_received: 100.5,
          quantity_blocked_difference: 0,
          release_status: 'ACEPTADO',
          blocked_document: null,
        },
        {
          id: 2,
          quantity_sent: 100,
          quantity_physical_received: 115,
          quantity_normal_received: 100,
          quantity_blocked_difference: 15,
          release_status: 'LIBERADO',
          blocked_document: { registry_number: 'NTR-000501' },
        },
        {
          id: 3,
          quantity_sent: 100,
          quantity_physical_received: 90,
          quantity_normal_received: 90,
          quantity_blocked_difference: 10,
          release_status: 'BLOQUEADO',
          blocked_document: { registry_number: 'NTR-000502' },
        },
      ],
    };

    reviewServiceMock.traceability.set(mockTrace);
    const trace = reviewServiceMock.traceability();

    expect(trace.detailsTransfers[0].quantity_normal_received).toBe(100.5);
    expect(trace.detailsTransfers[0].quantity_blocked_difference).toBe(0);
    expect(trace.detailsTransfers[0].release_status).toBe('ACEPTADO');

    expect(trace.detailsTransfers[1].quantity_normal_received).toBe(100);
    expect(trace.detailsTransfers[1].quantity_blocked_difference).toBe(15);
    expect(trace.detailsTransfers[1].release_status).toBe('LIBERADO');
    expect(trace.detailsTransfers[1].blocked_document.registry_number).toBe('NTR-000501');

    expect(trace.detailsTransfers[2].quantity_normal_received).toBe(90);
    expect(trace.detailsTransfers[2].quantity_blocked_difference).toBe(10);
    expect(trace.detailsTransfers[2].release_status).toBe('BLOQUEADO');
    expect(trace.detailsTransfers[2].blocked_document.registry_number).toBe('NTR-000502');
  });

  it('5.3 presenta la ubicación del error de paridad sin borrar los datos ingresados', () => {
    component.documentaryForm.patchValue({
      reason_code: 'DIFERENCIA_BALANZAS',
      operational_justification: 'Conteo verificado por planta',
      solution_code: 'CONFIRM_DIFFERENCE',
    });
    const message = (component as any).apiError({ error: {
      errors: [{ msg: 'Stock y Kardex no terminan con el mismo saldo.' }],
      details: [{ product_id: 5, sucursal_id: 2, storage_id: 20, stock: 110, kardex: 100 }],
    } }, 'Error');

    expect(message).toContain('producto 5');
    expect(message).toContain('sucursal 2, almacén 20');
    expect(component.documentaryForm.controls.operational_justification.value).toBe('Conteo verificado por planta');
    expect(component.selectedDetail()?.id).toBe(4);
  });
});
