import { TestBed } from '@angular/core/testing';
import { SessionManagementService } from './session-management.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { AssignShift } from 'src/app/auth/auth.interface';

describe('SessionManagementService', () => {
  let service: SessionManagementService;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      token: 'fake-jwt-token',
      getUser: {
        id: 1,
        full_names: 'OPERADOR PRUEBA',
        role: 'OPERADOR',
        assign_shift: []
      },
      logout: jasmine.createSpy('logout')
    };

    routerMock = {
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    TestBed.configureTestingModule({
      providers: [
        SessionManagementService,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(SessionManagementService);
  });

  afterEach(() => {
    service.stopMonitoring();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isWithinShift debe retornar true si no hay turnos configurados', () => {
    expect(service.isWithinShift([])).toBe(true);
  });

  it('isWithinShift valida correctamente el turno del día', () => {
    const today = new Date().getDay();
    const activeShift: AssignShift = {
      id: 1,
      day: 'HOY',
      number_day: today,
      hour_start: '00:00',
      hour_end: '23:59',
      status: true
    };

    expect(service.isWithinShift([activeShift])).toBe(true);

    const expiredShift: AssignShift = {
      id: 2,
      day: 'HOY',
      number_day: today,
      hour_start: '00:00',
      hour_end: '00:01',
      status: true
    };

    // Si la hora actual es posterior a 00:01, debe ser false
    const now = new Date();
    if (now.getHours() > 0 || now.getMinutes() > 1) {
      expect(service.isWithinShift([expiredShift])).toBe(false);
    }
  });
});
