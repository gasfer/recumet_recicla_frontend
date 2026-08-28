import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/auth/auth.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { permissionGuard } from './permission.guard';

@Component({ template: '' })
class GuardedTestComponent {}

describe('permissionGuard routing', () => {
  let router: Router;
  let withPermission: jasmine.Spy;
  let logout: jasmine.Spy;

  beforeEach(async () => {
    withPermission = jasmine.createSpy('withPermission');
    logout = jasmine.createSpy('logout');
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
            ],
          },
        ]),
      ],
      providers: [
        { provide: ValidatorsService, useValue: { withPermission } },
        { provide: AuthService, useValue: { logout } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('allows direct navigation when the user has the route permission', async () => {
    withPermission.and.returnValue(true);

    expect(await router.navigateByUrl('/protected-feature')).toBeTrue();
    expect(router.url).toBe('/protected-feature');
    expect(withPermission).toHaveBeenCalledWith('GASTOS', 'view');
    expect(logout).not.toHaveBeenCalled();
  });

  it('rejects direct navigation when the user lacks the route permission', async () => {
    withPermission.and.returnValue(false);

    expect(await router.navigateByUrl('/protected-feature')).toBeFalse();
    expect(router.url).not.toBe('/protected-feature');
    expect(logout).toHaveBeenCalled();
  });
});
