import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ErrorLogsService, PERMISSION_DENIED_FALLBACK } from './error-logs.service';

describe('ErrorLogsService permission feedback', () => {
  let service: ErrorLogsService;
  let navigateByUrl: jasmine.Spy;
  let fire: jasmine.Spy;

  beforeEach(() => {
    navigateByUrl = jasmine.createSpy('navigateByUrl');
    TestBed.configureTestingModule({
      providers: [
        ErrorLogsService,
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    service = TestBed.inject(ErrorLogsService);
    fire = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as never));
    localStorage.setItem('token', 'token-vigente');
    localStorage.setItem('id_sucursal', '2');
    localStorage.setItem('id_storage', '4');
  });

  afterEach(() => localStorage.clear());

  it('muestra el mensaje contextual del servidor ante HTTP 403 y conserva la sesión', () => {
    const error = {
      status: 403,
      error: { errors: [{ msg: 'No tiene permiso para consultar Compras. Comuníquese con soporte para solicitar la habilitación.' }] },
    };

    service.logDeErrores(error);

    expect(fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Sin permiso',
      text: error.error.errors[0].msg,
      icon: 'warning',
    }));
    expect(localStorage.getItem('token')).toBe('token-vigente');
    expect(localStorage.getItem('id_sucursal')).toBe('2');
    expect(localStorage.getItem('id_storage')).toBe('4');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('usa el mensaje alternativo cuando HTTP 403 no incluye detalle', () => {
    service.logDeErrores({ status: 403, error: {} });

    expect(fire).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Sin permiso',
      text: PERMISSION_DENIED_FALLBACK,
    }));
  });

  it('muestra una sola alerta cuando dos capas notifican el mismo error', () => {
    const error = { status: 403, error: {} };

    service.logDeErrores(error);
    service.logDeErrores(error);

    expect(fire).toHaveBeenCalledTimes(1);
  });

  it('delega al modal el error de autorización de edición de compra', () => {
    const notifications = spyOn(service, 'notifications');

    service.logDeErrores({
      status: 422,
      error: {
        code: 'PURCHASE_EDIT_AUTHORIZATION_REQUIRED',
        errors: [{ msg: 'La ventana de regularización venció.' }],
      },
    });

    expect(notifications).not.toHaveBeenCalled();
    expect(fire).not.toHaveBeenCalled();
  });

  it('mantiene separado el cierre de sesión para HTTP 401', () => {
    service.logDeErrores({ status: 401 });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/auth');
  });
});
