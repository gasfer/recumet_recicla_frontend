import { FormBuilder } from '@angular/forms';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { QueryInputsComponent as InputsQueryComponent } from 'src/app/pages/inputs/query-inputs/query-inputs.component';
import { InputsService as InputsModuleService } from 'src/app/pages/inputs/services/inputs.service';
import { ProvidersService as InputsProvidersService } from 'src/app/pages/inputs/services/providers.service';
import { QueryInputsComponent as ExpensesQueryComponent } from 'src/app/pages/Expenses/query-inputs/query-inputs.component';
import { InputsService as ExpensesModuleService } from 'src/app/pages/Expenses/services/inputs.service';
import { ProvidersService as ExpensesProvidersService } from 'src/app/pages/Expenses/services/providers.service';

interface EntryPointDefinition {
  name: string;
  component: new () => InputsQueryComponent | ExpensesQueryComponent;
  inputsService: unknown;
  providersService: unknown;
}

const entryPoints: EntryPointDefinition[] = [
  {
    name: 'pages/inputs',
    component: InputsQueryComponent,
    inputsService: InputsModuleService,
    providersService: InputsProvidersService,
  },
  {
    name: 'pages/Expenses',
    component: ExpensesQueryComponent,
    inputsService: ExpensesModuleService,
    providersService: ExpensesProvidersService,
  },
];

const purchase = {
  id: 10372,
  cod: 'COMP10372',
  date_voucher: '2026-09-03',
  detailsInput: [],
  provider: { id: 77, full_names: 'Proveedor de prueba' },
} as any;

for (const entryPoint of entryPoints) {
  describe(`Purchase edit entry point: ${entryPoint.name}`, () => {
    const permission = jasmine.createSpy('withPermission');
    const deadline = jasmine.createSpy('hasDaysPassedSinceEdit');
    const navigateByUrl = jasmine.createSpy('navigateByUrl');
    let inputsService: any;
    let component: InputsQueryComponent | ExpensesQueryComponent;

    beforeEach(() => {
      permission.calls.reset();
      deadline.calls.reset();
      navigateByUrl.calls.reset();
      navigateByUrl.and.resolveTo(true);
      inputsService = {
        isEdit: false,
        detailShopping: signal<any[]>([{ id: 'unchanged-detail' }]),
        providerSelect: signal<any>({ id: 'unchanged-provider' }),
        dataInputForEdit: signal<any>({ id: 'unchanged-purchase' }),
        types_registry: signal([]),
        referral_sources: signal([]),
        resetInput: jasmine.createSpy('resetInput').and.callFake(() => {
          inputsService.detailShopping.set([]);
          inputsService.providerSelect.set(undefined);
        }),
      };

      TestBed.configureTestingModule({
        providers: [
          FormBuilder,
          { provide: ValidatorsService, useValue: {
            decimalLength: signal(2),
            id_sucursal: signal(1),
            withPermission: permission,
            hasDaysPassedSinceEdit: deadline,
          } },
          { provide: entryPoint.inputsService, useValue: inputsService },
          { provide: entryPoint.providersService, useValue: {} },
          { provide: Router, useValue: { navigateByUrl } },
        ],
      });
      component = TestBed.runInInjectionContext(() => new entryPoint.component());
    });

    it('opens an authorized purchase inside the edit deadline', () => {
      permission.and.returnValue(true);
      deadline.and.returnValue(false);

      component.requestPurchaseEdit(purchase);

      expect(inputsService.resetInput).toHaveBeenCalledTimes(1);
      expect(inputsService.isEdit).toBeTrue();
      expect(inputsService.providerSelect()).toBe(purchase.provider);
      expect(inputsService.dataInputForEdit()).toBe(purchase);
      expect(navigateByUrl).toHaveBeenCalledOnceWith('/inputs/input-small');
    });

    it('reports a missing permission before mutating state or navigating', () => {
      permission.and.returnValue(false);
      deadline.and.returnValue(false);
      const alert = spyOn(Swal, 'fire').and.resolveTo({} as any);

      component.requestPurchaseEdit(purchase);

      expect(alert).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Sin permiso para editar',
        text: 'No tiene habilitado el permiso Modificar en el módulo Compras. Solicite a un administrador que revise sus permisos.',
      }));
      expect(inputsService.resetInput).not.toHaveBeenCalled();
      expect(inputsService.isEdit).toBeFalse();
      expect(inputsService.detailShopping()).toEqual([{ id: 'unchanged-detail' }]);
      expect(inputsService.providerSelect()).toEqual({ id: 'unchanged-provider' });
      expect(inputsService.dataInputForEdit()).toEqual({ id: 'unchanged-purchase' });
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('reports an expired deadline without presenting a permission error', () => {
      permission.and.returnValue(true);
      deadline.and.returnValue(true);
      const alert = spyOn(Swal, 'fire').and.resolveTo({} as any);

      component.requestPurchaseEdit(purchase);

      expect(alert).toHaveBeenCalledWith(jasmine.objectContaining({
        title: 'Plazo de edición vencido',
      }));
      const alertOptions = alert.calls.mostRecent().args[0] as any;
      expect(alertOptions.text).not.toContain('permiso');
      expect(inputsService.isEdit).toBeFalse();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });
}
