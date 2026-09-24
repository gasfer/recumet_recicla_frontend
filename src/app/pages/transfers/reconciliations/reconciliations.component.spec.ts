import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReconciliationsComponent } from './reconciliations.component';
import { TransferReviewService } from 'src/app/services/transfer-review.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { TransfersService } from '../services/transfers.service';
import { ClassifiedService } from '../../classifieds/services/classified.service';

describe('ReconciliationsComponent reception differences', () => {
  it('inicia filtrando pendientes y muestra severidad según el estado derivado', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TransferReviewService, useValue: {} },
        { provide: ValidatorsService, useValue: {} },
        { provide: NotificationsService, useValue: { transferReviewUpdates$: signal(null) } },
        { provide: TransfersService, useValue: {} },
        { provide: ClassifiedService, useValue: {} },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ReconciliationsComponent());

    expect(component.differenceStatus).toBe('PENDIENTE');
    expect(component.differenceStatusSeverity('PENDIENTE')).toBe('warning');
    expect(component.differenceStatusSeverity('PARCIAL')).toBe('info');
    expect(component.differenceStatusSeverity('RESUELTA')).toBe('success');
    expect(component.differenceStatusSeverity('NO_ATRIBUIBLE')).toBe('danger');
    expect(component.differenceTypeLabel('FALTANTE')).toBe('Faltante');
  });
});
