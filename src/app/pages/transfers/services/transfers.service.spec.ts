import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransfersService } from './transfers.service';

describe('TransfersService cancellation contracts', () => {
  let service: TransfersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TransfersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía el motivo tipado a la ruta de anulación de recepción', () => {
    service.cancelReception(12, 'Recepción registrada por error').subscribe((response) => {
      expect(response.ok).toBeTrue();
      expect(response.msg).toBe('Recepción anulada correctamente');
    });

    const request = http.expectOne((candidate) => candidate.url.endsWith('/transfers/reception/12/cancel'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ reason: 'Recepción registrada por error' });
    request.flush({ ok: true, msg: 'Recepción anulada correctamente' });
  });
});
