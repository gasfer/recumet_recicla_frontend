import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PERMISSION_MODULE_LABELS, permissionModuleLabel, TRANSFER_REVIEW_ACTION_HELP } from 'src/app/core/constants/permission-presentation.constants';
import { User } from '../../../interfaces/user.interface';
import { UsersService } from '../../../services/users.service';
import { ModalAssignPermissionsComponent, updateAllowedCategoryTypes } from './modal-assign-permissions.component';
import {
  PRODUCT_ACCESS_CONTEXT_OPTIONS,
  PRODUCT_ACCESS_MODULE_COLUMN_LABEL,
  PRODUCT_ACCESS_SECTION_DESCRIPTION,
  PRODUCT_ACCESS_SECTION_TITLE,
  PRODUCT_CATEGORY_TYPE_OPTIONS,
  ProductAccessContext,
  ProductCategoryType,
} from 'src/app/core/constants/product-category-access.constants';

describe('ModalAssignPermissionsComponent category type selection', () => {
  it('uses clear labels without changing internal module or category values', () => {
    expect(PRODUCT_ACCESS_SECTION_TITLE).toBe('Tipos de producto permitidos por módulo');
    expect(PRODUCT_ACCESS_SECTION_DESCRIPTION).toContain('no habilita el acceso general al módulo');
    expect(PRODUCT_ACCESS_MODULE_COLUMN_LABEL).toBe('Módulo de operación');
    expect(PRODUCT_CATEGORY_TYPE_OPTIONS.map(({ label }) => label)).toEqual([
      'Materia prima (MP)',
      'Producto terminado (PT)',
      'Artículo de reventa (AR)',
    ]);
    expect(PRODUCT_CATEGORY_TYPE_OPTIONS.map(({ value }) => value)).toEqual([
      ProductCategoryType.RawMaterial,
      ProductCategoryType.FinishedProduct,
      ProductCategoryType.ResaleItem,
    ]);
    expect(PRODUCT_ACCESS_CONTEXT_OPTIONS.map(({ value }) => value)).toEqual([
      ProductAccessContext.Purchases,
      ProductAccessContext.Sales,
      ProductAccessContext.Transfers,
      ProductAccessContext.Classifieds,
    ]);
  });

  it('adds a checked database category type without duplicating existing values', () => {
    expect(updateAllowedCategoryTypes(['RAW_MATERIAL'], 'FINISHED_PRODUCT', true))
      .toEqual(['RAW_MATERIAL', 'FINISHED_PRODUCT']);
    expect(updateAllowedCategoryTypes(['RAW_MATERIAL'], 'RAW_MATERIAL', true))
      .toEqual(['RAW_MATERIAL']);
  });

  it('removes an unchecked database category type from the submitted array', () => {
    expect(updateAllowedCategoryTypes(
      ['RAW_MATERIAL', 'FINISHED_PRODUCT', 'RESALE_ITEM'],
      'FINISHED_PRODUCT',
      false,
    )).toEqual(['RAW_MATERIAL', 'RESALE_ITEM']);
  });

  it('creates a valid array when the stored value is missing', () => {
    expect(updateAllowedCategoryTypes(undefined, 'RAW_MATERIAL', true))
      .toEqual(['RAW_MATERIAL']);
  });
});

describe('ModalAssignPermissionsComponent Spanish permission labels', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
  });

  it('provides a Spanish label for every administrable permission code', () => {
    const component = TestBed.runInInjectionContext(() => new ModalAssignPermissionsComponent());
    const modules = component.permissionGroups().flatMap((group) => group.permissions.map(({ module }) => module));
    const missingLabels = modules.filter((module) => !PERMISSION_MODULE_LABELS[module]);

    expect(missingLabels).toEqual([]);
  });

  it('presents transfer review entirely in Spanish without changing its code', () => {
    expect(permissionModuleLabel('TRANSFER_REVIEW')).toBe('Revisión de traslados');
    expect(TRANSFER_REVIEW_ACTION_HELP).toBe(
      'Ver: consultar · Crear: asignar · Modificar: resolver · Eliminar: reabrir · Reportes: aprobar',
    );
  });

  it('submits the original permission code after editing through its Spanish label', () => {
    const usersService = TestBed.inject(UsersService);
    const save = spyOn(usersService, 'postAssignPermissions').and.returnValue(of({}));
    const component = TestBed.runInInjectionContext(() => new ModalAssignPermissionsComponent());
    component.ngOnInit();
    usersService.assignPermisosSubs.emit({
      id: 7,
      full_names: 'Usuario de prueba',
      number_document: '7000001',
      cellphone: 70000001,
      sex: 'F',
      photo: null,
      position: 'OPERADOR',
      email: 'usuario@prueba.local',
      role: 'OPERADOR',
      status: true,
      updatedAt: '2026-08-29T00:00:00.000Z',
      assign_permission: [{
        id: 1,
        module: 'TRANSFER_REVIEW',
        view: true,
        create: false,
        update: false,
        delete: false,
        reports: false,
        status: true,
      }],
      assign_shift: [],
      assign_sucursales: [],
    } as User);

    component.sendNewPermissions();

    const submitted = save.calls.mostRecent().args[0];
    expect(submitted.find(({ module }) => module === 'TRANSFER_REVIEW')?.view).toBeTrue();
    expect(submitted.some(({ module }) => module === 'Revisión de traslados')).toBeFalse();
    component.ngOnDestroy();
  });

  it('submits category codes without granting the general module action', () => {
    const usersService = TestBed.inject(UsersService);
    const save = spyOn(usersService, 'postAssignPermissions').and.returnValue(of({}));
    const component = TestBed.runInInjectionContext(() => new ModalAssignPermissionsComponent());
    component.ngOnInit();
    usersService.assignPermisosSubs.emit({
      id: 8,
      full_names: 'Usuario de categorías',
      number_document: '8000001',
      cellphone: 70000002,
      sex: 'F',
      photo: null,
      position: 'OPERADOR',
      email: 'categorias@prueba.local',
      role: 'OPERADOR',
      status: true,
      updatedAt: '2026-09-03T00:00:00.000Z',
      assign_permission: [{
        id: 2,
        module: 'COMPRAS',
        view: true,
        create: false,
        update: false,
        delete: false,
        reports: false,
        status: true,
        allowed_category_types: ['RAW_MATERIAL'],
      }],
      assign_shift: [],
      assign_sucursales: [],
    } as User);

    component.setCategoryTypeAllowed('COMPRAS', 'FINISHED_PRODUCT', true);
    component.sendNewPermissions();

    const purchasePermission = save.calls.mostRecent().args[0]
      .find(({ module }) => module === 'COMPRAS');
    expect(purchasePermission?.allowed_category_types).toEqual(['RAW_MATERIAL', 'FINISHED_PRODUCT']);
    expect(purchasePermission?.update).toBeFalse();
    expect(save.calls.mostRecent().args[0].some(({ module }) => module === 'Compras')).toBeFalse();
    component.ngOnDestroy();
  });
});
