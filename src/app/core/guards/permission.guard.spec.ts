import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import Swal from 'sweetalert2';
import { ValidatorsService } from 'src/app/services/validators.service';
import { permissionGuard } from './permission.guard';

@Component({ template: '' })
class GuardedTestComponent {}

describe('permissionGuard routing', () => {
  let router: Router;
  let withPermission: jasmine.Spy;

  beforeEach(async () => {
    withPermission = jasmine.createSpy('withPermission');
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as never));

    await TestBed.configureTestingModule({
      declarations: [GuardedTestComponent],
      imports: [
        RouterTestingModule.withRoutes([
          {
            path: '',
            canActivateChild: [permissionGuard],
            children: [
              {
                path: 'protected-feature',
                component: GuardedTestComponent,
                data: { name: 'GASTOS', action: 'view' },
              },
              {
                path: 'dashboard/home',
                component: GuardedTestComponent,
                data: { name: 'INIT' },
              },
            ],
          },
        ]),
      ],
      providers: [
        { provide: ValidatorsService, useValue: { withPermission } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('allows direct navigation when the user has the route permission', async () => {
    withPermission.and.returnValue(true);

    expect(await router.navigateByUrl('/protected-feature')).toBeTrue();
    expect(router.url).toBe('/protected-feature');
    expect(withPermission).toHaveBeenCalledWith('GASTOS', 'view');
  });

  it('redirects direct navigation without permission and preserves the authenticated area', async () => {
    withPermission.and.returnValue(false);

    expect(await router.navigateByUrl('/protected-feature')).toBeTrue();
    expect(router.url).toBe('/dashboard/home');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Sin permiso',
      text: 'No tiene permiso para ver Gastos. Comuníquese con soporte para solicitar la habilitación.',
      icon: 'warning',
    }));
  });

  it('keeps Administrator bypass behavior supplied by the central validator', async () => {
    withPermission.and.returnValue(true);

    expect(await router.navigateByUrl('/protected-feature')).toBeTrue();
    expect(router.url).toBe('/protected-feature');
  });
});
