import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { QueryReceptionsComponent } from './query-receptions.component';
import { TransfersService } from '../services/transfers.service';
import { SucursalesService } from '../../managements/services/sucursales.service';
import { TransferReviewService } from 'src/app/services/transfer-review.service';
import { ValidatorsService } from 'src/app/services/validators.service';
import { GetAllTransfers, Transfer } from '../interfaces/transfers.interface';

describe('QueryReceptionsComponent cancellation actions', () => {
  let role: string;
  let response: GetAllTransfers;
  let component: QueryReceptionsComponent;

  const transfer = (enabled: boolean): Transfer => ({
    id: 12,
    cod: 'TRAS00012',
    status: 'RECEIVED',
    date_send: '2026-09-10',
    date_received: '2026-09-11',
    observations_send: '',
    observations_received: '',
    total: '0',
    id_sucursal_send: 1,
    id_storage_send: 1,
    id_sucursal_received: 2,
    id_storage_received: 2,
    id_user_send: 1,
    id_user_received: 2,
    createdAt: '',
    updatedAt: '',
    sucursal_send: { name: 'Origen' },
    sucursal_received: { name: 'Destino' },
    storage_send: { name: 'Principal' },
    storage_received: { name: 'Principal' },
    user_send: { full_names: 'Emisor' },
    user_received: { full_names: 'Receptor' },
    detailsTransfers: [],
    total_quantity: 10,
    reconciliation_status: 'COMPLETADO',
    pending_review_items: 0,
    reception_cancellation: {
      enabled,
      reason: enabled ? null : 'Debe cerrar una retención.',
      blockers: enabled ? [] : [{ type: 'ACTIVE_INVENTORY_HOLDS', count: 1 }],
    },
  });

  beforeEach(() => {
    role = 'ADMINISTRADOR';
    response = {
      ok: true,
      transfers: {
        previousPage: null, currentPage: 1, nextPage: null, total: 1, per_page: 50, from: 1, to: 1,
        data: [transfer(true)], totals: { totalTransfer: 0, totalQuantity: 10 },
      },
    };
    TestBed.configureTestingModule({
      providers: [
        QueryReceptionsComponent,
        FormBuilder,
        { provide: ValidatorsService, useValue: {
          decimalLength: () => 2,
          id_sucursal: () => 2,
          user: () => ({ role }),
          withPermission: () => true,
        } },
        { provide: TransfersService, useValue: {
          getAllAndSearchTransfers: () => of(response),
          detailsSubs$: new Subject<Transfer>(),
          printPdfReport: () => undefined,
          printReceptionPdfReport: () => undefined,
        } },
        { provide: SucursalesService, useValue: {} },
        { provide: TransferReviewService, useValue: { openTrace: () => undefined } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    });
    component = TestBed.inject(QueryReceptionsComponent);
  });

  it('muestra anulación activa al administrador cuando backend la habilita', () => {
    component.paramsSearch.update((params) => ({ ...params, status: 'RECEIVED' }));
    component.getAllAndSearchTransfers(1, 50);
    expect(response.transfers.data[0].options?.some(({ tooltip }) => tooltip === 'Anular recepción')).toBeTrue();
  });

  it('muestra el bloqueo del backend y oculta la acción a no administradores', () => {
    response.transfers.data = [transfer(false)];
    component.paramsSearch.update((params) => ({ ...params, status: 'RECEIVED' }));
    component.getAllAndSearchTransfers(1, 50);
    expect(response.transfers.data[0].options?.some(({ tooltip }) => tooltip === 'Debe cerrar una retención.')).toBeTrue();

    role = 'OPERADOR';
    response.transfers.data = [transfer(true)];
    component.getAllAndSearchTransfers(1, 50);
    expect(response.transfers.data[0].options?.some(({ tooltip }) => tooltip === 'Anular recepción')).toBeFalse();
  });
});
