import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { PurchaseReportComponent } from './purchase-report.component';
import { InputsService } from '../services/inputs.service';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { CategoriesService } from '../../inventories/services/categories.service';
import { ProductsService } from '../../inventories/services/products.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { AuthService } from 'src/app/auth/auth.service';

describe('PurchaseReportComponent catalog scope', () => {
  let component: PurchaseReportComponent;
  let categoryRequests: Subject<any>[];
  let productRequests: Subject<any>[];

  beforeEach(() => {
    categoryRequests = [];
    productRequests = [];
    TestBed.configureTestingModule({
      providers: [
        PurchaseReportComponent,
        FormBuilder,
        { provide: ValidatorsService, useValue: { id_sucursal: () => 1, id_storage: () => 10 } },
        { provide: AuthService, useValue: { getUser: { role: 'OPERADOR', assign_sucursales: [{ id_sucursal: 1 }] } } },
        { provide: InputsService, useValue: { getOperationalDate: () => of({ ok: true, date: '2026-09-15' }), getPurchaseReport: () => of({ inputs: { data: [] } }) } },
        { provide: SucursalesService, useValue: { getAllAndSearch: () => of({ sucursales: { data: [
          { id: 1, name: 'Autorizada', storage: [{ id: 10, name: 'Central', status: true }] },
          { id: 2, name: 'No autorizada', storage: [{ id: 20, name: 'Externo', status: true }] },
        ] } }) } },
        { provide: CategoriesService, useValue: { getCategorySelect: () => { const request = new Subject<any>(); categoryRequests.push(request); return request; } } },
        { provide: ProductsService, useValue: { getSelectProducts: () => { const request = new Subject<any>(); productRequests.push(request); return request; } } },
      ],
    });
    component = TestBed.inject(PurchaseReportComponent);
  });

  it('starts in the server operational month and exposes only authorized branch data', () => {
    spyOn(component, 'search');

    component.ngOnInit();

    expect(component.form.value.dates).toEqual(new Date('2026-09-15'));
    expect(component.branches().map(branch => branch.id)).toEqual([1]);
    expect(component.form.value.id_sucursal).toEqual([1]);
    expect(component.storages().map(storage => storage.id)).toEqual([10]);
    expect(component.search).toHaveBeenCalled();
  });

  it('keeps catalogs aligned with the latest selected branch when requests complete out of order', () => {
    component.branches.set([
      { id: 1, name: 'Central', storage: [{ id: 10, name: 'A', status: true }] } as any,
      { id: 2, name: 'Norte', storage: [{ id: 20, name: 'B', status: true }] } as any,
    ]);
    component.form.patchValue({ id_sucursal: [1] });
    component.onBranchChange();
    component.form.patchValue({ id_sucursal: [2] });
    component.onBranchChange();

    categoryRequests[0].next({ categories: [{ id: 101, name: 'Anterior' }] });
    productRequests[0].next({ products: [{ id: 201, name: 'Anterior' }] });
    categoryRequests[1].next({ categories: [{ id: 102, name: 'Actual' }] });
    productRequests[1].next({ products: [{ id: 202, name: 'Actual' }] });

    expect(component.storages().map(storage => storage.id)).toEqual([20]);
    expect(component.categories().map(category => category.id)).toEqual([102]);
    expect(component.products().map(product => product.id)).toEqual([202]);
  });
});
