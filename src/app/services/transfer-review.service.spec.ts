import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NotificationsService } from './notifications.service';
import { TransferReviewService } from './transfer-review.service';
import { ValidatorsService } from './validators.service';

describe('TransferReviewService automatic context loading', () => {
  let http: HttpTestingController;
  let service: TransferReviewService;
  let withPermission: jasmine.Spy;

  beforeEach(() => {
    withPermission = jasmine.createSpy('withPermission');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TransferReviewService,
        {
          provide: ValidatorsService,
          useValue: {
            id_sucursal: signal(2),
            id_storage: signal(4),
            withPermission,
          },
        },
        {
          provide: NotificationsService,
          useValue: { transferReviewUpdates$: new Subject<unknown>() },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TransferReviewService);
  });

  afterEach(() => http.verify());

  it('omite la consulta automática y el panel cuando falta el permiso de lectura', () => {
    withPermission.and.returnValue(false);
    let reviews: unknown[] | undefined;

    service.checkCurrentContext(true).subscribe((result) => { reviews = result; });

    expect(reviews).toEqual([]);
    expect(service.openReviews()).toEqual([]);
    expect(service.showAlertDialog()).toBeFalse();
    expect(service.contextReady()).toBeTrue();
    http.expectNone(`${environment.base_url}/transfer-review-notes/open`);
  });

  it('consulta el recurso opcional cuando el usuario tiene permiso', () => {
    withPermission.and.returnValue(true);
    let reviews: unknown[] | undefined;

    service.checkCurrentContext(true).subscribe((result) => { reviews = result; });

    const request = http.expectOne((candidate) => candidate.url === `${environment.base_url}/transfer-review-notes/open`);
    expect(request.request.params.get('id_sucursal')).toBe('2');
    expect(request.request.params.get('id_storage')).toBe('4');
    request.flush({ ok: true, reviews: [] });
    expect(reviews).toEqual([]);
  });
});
