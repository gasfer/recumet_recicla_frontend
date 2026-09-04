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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: ValidatorsService, useValue: {} },
        { provide: ProductsService, useValue: { getSelectProducts: () => of({ products: [] }) } },
        { provide: TransferReviewService, useValue: {
          assignableUsers: signal([]), focusedReviewNoteId: signal(null), setTraceVisibility: () => undefined,
        } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new TransferReviewTraceComponent());
    component.selectedDetail.set({
      id: 4, quantity_difference: 8, quantity_resolved: 2,
    } as any);
    component.automaticPreview.set({
      pending_quantity: 6,
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
});
