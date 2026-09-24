import { canCancelReception, isTransferCancellationAdministrator, receptionCancellationMessage } from './transfer-cancellation-actions.util';
import { Transfer } from '../interfaces/transfers.interface';

describe('acciones de anulación de traslado y recepción', () => {
  const transfer = (values: Partial<Transfer>): Transfer => values as Transfer;

  it('reserva las acciones de baja para ADMINISTRADOR', () => {
    expect(isTransferCancellationAdministrator('ADMINISTRADOR')).toBeTrue();
    expect(isTransferCancellationAdministrator('OPERADOR')).toBeFalse();
  });

  it('habilita la anulación de recepción sólo con autorización del backend', () => {
    expect(canCancelReception(transfer({ status: 'RECEIVED', reception_cancellation: { enabled: true, reason: null, blockers: [] } }))).toBeTrue();
    expect(canCancelReception(transfer({ status: 'RECEIVED', reception_cancellation: { enabled: false, reason: 'Hay pendientes.', blockers: [] } }))).toBeFalse();
    expect(canCancelReception(transfer({ status: 'PENDING', reception_cancellation: { enabled: true, reason: null, blockers: [] } }))).toBeFalse();
  });

  it('presenta el motivo de bloqueo entregado por el backend', () => {
    expect(receptionCancellationMessage(transfer({ reception_cancellation: { enabled: false, reason: 'Debe cerrar una retención.', blockers: [] } })))
      .toBe('Debe cerrar una retención.');
  });
});
