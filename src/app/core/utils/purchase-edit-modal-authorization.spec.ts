import { signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ComponentsService } from 'src/app/core/services/components.service';
import { PurchaseTraceabilityApiService } from 'src/app/core/services/purchase-traceability-api.service';
import { BankService } from 'src/app/pages/managements/services/bank.service';
import { ScalesService } from 'src/app/pages/inventories/services/scales.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { ModalSaveInputComponent as InputsModalComponent } from 'src/app/pages/inputs/input-small/components/modal-save-input/modal-save-input.component';
import { InputsService as InputsModuleService } from 'src/app/pages/inputs/services/inputs.service';
import { ModalSaveInputComponent as ExpensesModalComponent } from 'src/app/pages/Expenses/input-small/components/modal-save-input/modal-save-input.component';
import { InputsService as ExpensesModuleService } from 'src/app/pages/Expenses/services/inputs.service';

const modalEntryPoints = [
  { name: 'pages/inputs', component: InputsModalComponent, inputsService: InputsModuleService },
  { name: 'pages/Expenses', component: ExpensesModalComponent, inputsService: ExpensesModuleService },
] as const;

const editablePurchase = {
  id: 10372,
  id_scales: 1,
  id_sucursal: 1,
  id_storage: 1,
  createdAt: new Date().toISOString(),
  date_voucher: '2026-09-03',
  registry_number: '10372',
  discount: 0,
  type_payment: 'EFECTIVO',
  type: 'CONTADO',
  total: 100,
  comments: '',
  account_input: null,
  id_bank: null,
  number_transaction: null,
  type_registry: 'BOLETA',
  is_paid: 'false',
  referral_sources: '',
  old_customer: true,
  with_pickup: false,
  status: 'ACTIVE',
  accounts_payable: null,
} as any;

const unpricedPurchase = {
  ...editablePurchase,
  total: 0,
  detailsInput: [{ product: { id: 20 }, quantity: 5, cost: 0, total: 0 }],
} as any;

for (const entryPoint of modalEntryPoints) {
  describe(`Purchase authorizers modal: ${entryPoint.name}`, () => {
    const getAuthorizers = jasmine.createSpy('getAuthorizers');
    const navigateByUrl = jasmine.createSpy('navigateByUrl');
    let inputsService: any;
    let component: InputsModalComponent | ExpensesModalComponent;

    beforeEach(() => {
      getAuthorizers.calls.reset();
      navigateByUrl.calls.reset();
      navigateByUrl.and.resolveTo(true);
      inputsService = {
        isEdit: false,
        showModalSaveInput: true,
        detailShopping: signal<any[]>([]),
        providerSelect: signal<any>(undefined),
        dataInputForEdit: signal<any>(editablePurchase),
        types_registry: signal([]),
        referral_sources: signal([]),
        resetInput: jasmine.createSpy('resetInput'),
      };

      TestBed.configureTestingModule({
        providers: [
          FormBuilder,
          { provide: entryPoint.inputsService, useValue: inputsService },
          { provide: ValidatorsService, useValue: { decimalLength: signal(2), id_sucursal: signal(1) } },
          { provide: BankService, useValue: {} },
          { provide: ScalesService, useValue: {} },
          { provide: ComponentsService, useValue: {} },
          { provide: PurchaseTraceabilityApiService, useValue: { getAuthorizers } },
          { provide: Router, useValue: { navigateByUrl } },
        ],
      });
      component = TestBed.runInInjectionContext(() => new entryPoint.component());
    });

    it('does not request authorizers outside an edit flow', () => {
      getAuthorizers.and.returnValue(of({ users: [] }));

      component.onShowModal();

      expect(getAuthorizers).not.toHaveBeenCalled();
    });

    it('requests authorizers after an authorized edit flow opens', () => {
      inputsService.isEdit = true;
      getAuthorizers.and.returnValue(of({ users: [] }));

      component.onShowModal();

      expect(getAuthorizers).toHaveBeenCalledTimes(1);
    });

    it('omits authorizers and required metadata for an initial price assignment', () => {
      inputsService.isEdit = true;
      inputsService.dataInputForEdit.set(unpricedPurchase);
      inputsService.detailShopping.set([{ id: 20, quantity: 5, costo: 10, import: 50 }]);
      getAuthorizers.and.returnValue(of({ users: [] }));

      component.onShowModal();

      expect(component.editAuthorizationRequired()).toBeFalse();
      expect(component.formInput.get('audit_reason')?.hasError('required')).toBeFalse();
      expect(component.formInput.get('id_authorizer_user')?.hasError('required')).toBeFalse();
      expect(getAuthorizers).not.toHaveBeenCalled();
    });

    it('allows completing a pending cost without changing an existing cost', () => {
      inputsService.isEdit = true;
      inputsService.dataInputForEdit.set({
        ...editablePurchase,
        total: 10,
        detailsInput: [
          { product: { id: 10 }, quantity: 5, cost: 2, total: 10 },
          { product: { id: 20 }, quantity: 5, cost: 0, total: 0 },
        ],
      });
      inputsService.detailShopping.set([
        { id: 10, quantity: 5, costo: 2, import: 10 },
        { id: 20, quantity: 5, costo: 3, import: 15 },
      ]);
      getAuthorizers.and.returnValue(of({ users: [] }));

      component.onShowModal();

      expect(component.editAuthorizationRequired()).toBeFalse();
      expect(getAuthorizers).not.toHaveBeenCalled();
    });

    it('requires authorization when the 24-hour regularization window expired', () => {
      inputsService.isEdit = true;
      inputsService.dataInputForEdit.set({
        ...unpricedPurchase,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      });
      inputsService.detailShopping.set([{ id: 20, quantity: 5, costo: 10, import: 50 }]);
      getAuthorizers.and.returnValue(of({ users: [] }));

      component.onShowModal();

      expect(component.editAuthorizationRequired()).toBeTrue();
      expect(getAuthorizers).toHaveBeenCalledTimes(1);
    });

    it('requires and loads authorization if an unpriced purchase receives another business change', () => {
      inputsService.isEdit = true;
      inputsService.dataInputForEdit.set(unpricedPurchase);
      inputsService.detailShopping.set([{ id: 20, quantity: 5, costo: 10, import: 50 }]);
      getAuthorizers.and.returnValue(of({ users: [] }));
      component.onShowModal();

      component.formInput.patchValue({ discount: 5, total: 45 });
      component.refreshEditAuthorizationPolicy();

      expect(component.editAuthorizationRequired()).toBeTrue();
      expect(component.formInput.get('audit_reason')?.hasError('required')).toBeTrue();
      expect(component.formInput.get('id_authorizer_user')?.hasError('required')).toBeTrue();
      expect(getAuthorizers).toHaveBeenCalledTimes(1);
    });

    it('keeps form data and reveals authorization after a server reclassification', () => {
      inputsService.isEdit = true;
      inputsService.dataInputForEdit.set(unpricedPurchase);
      inputsService.detailShopping.set([{ id: 20, quantity: 5, costo: 10, import: 50 }]);
      getAuthorizers.and.returnValue(of({ users: [] }));
      const alert = spyOn(Swal, 'fire').and.resolveTo({} as any);
      component.onShowModal();

      component.handlePurchaseEditAuthorizationError({
        error: {
          code: 'PURCHASE_EDIT_AUTHORIZATION_REQUIRED',
          errors: [{ msg: 'La compra cambió y ahora requiere autorización.' }],
        },
      });

      expect(component.editAuthorizationRequired()).toBeTrue();
      expect(inputsService.detailShopping()).toEqual([{ id: 20, quantity: 5, costo: 10, import: 50 }]);
      expect(inputsService.resetInput).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(getAuthorizers).toHaveBeenCalledTimes(1);
      expect(alert).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Autorización requerida' }));
    });

    it('stops editing and returns to the purchase query after a concurrent 403', () => {
      inputsService.isEdit = true;
      getAuthorizers.and.returnValue(throwError(() => ({ status: 403 })));

      component.onShowModal();

      expect(inputsService.showModalSaveInput).toBeFalse();
      expect(inputsService.isEdit).toBeFalse();
      expect(inputsService.resetInput).toHaveBeenCalledTimes(1);
      expect(navigateByUrl).toHaveBeenCalledOnceWith('/inputs/query-inputs');
    });
  });
}
