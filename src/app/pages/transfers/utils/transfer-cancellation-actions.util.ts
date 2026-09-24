import { Transfer } from '../interfaces/transfers.interface';

export const isTransferCancellationAdministrator = (role?: string | null): boolean => role === 'ADMINISTRADOR';

export const receptionCancellationMessage = (transfer: Transfer): string => (
  transfer.reception_cancellation?.reason
  || 'La recepción tiene conciliaciones, retenciones o acciones pendientes.'
);

export const canCancelReception = (transfer: Transfer): boolean => (
  transfer.status === 'RECEIVED' && transfer.reception_cancellation?.enabled === true
);
