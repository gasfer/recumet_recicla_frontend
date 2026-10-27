export type PurchaseEditBlockReason = 'permission' | 'deadline' | null;

export interface PurchaseEditEligibility {
  allowed: boolean;
  reason: PurchaseEditBlockReason;
  title: string;
  message: string;
  tooltip: string;
  ariaLabel: string;
}

export const PURCHASE_EDIT_PERMISSION_MESSAGE =
  'No tiene habilitado el permiso Modificar en el módulo Compras. Solicite a un administrador que revise sus permisos.';

export const PURCHASE_EDIT_DEADLINE_MESSAGE =
  'Esta compra ya no puede editarse porque superó el plazo máximo permitido de 30 días.';

export const isPurchaseEditWindowExpired = (
  date: unknown,
  now: string | number | Date = new Date(),
): boolean => {
  const dateValue = date instanceof Date ? date.getTime() : new Date(date as string | number).getTime();
  const nowValue = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return !Number.isFinite(dateValue) || !Number.isFinite(nowValue)
    || dateValue > nowValue || nowValue - dateValue > 30 * 24 * 60 * 60 * 1000;
};

export const isPurchaseEditPermissionDenied = (error: unknown): boolean =>
  typeof error === 'object'
  && error !== null
  && 'status' in error
  && (error as { status?: number }).status === 403;

export const resolvePurchaseEditEligibility = (
  canUpdatePurchases: boolean,
  editDeadlineExpired: boolean,
  isAdmin: boolean = false,
  canCorrectLatePrice: boolean = false,
): PurchaseEditEligibility => {
  if (!isAdmin && !canUpdatePurchases) {
    return {
      allowed: false,
      reason: 'permission',
      title: 'Sin permiso para editar',
      message: PURCHASE_EDIT_PERMISSION_MESSAGE,
      tooltip: 'Sin permiso para modificar compras',
      ariaLabel: 'Editar compra no disponible: sin permiso para modificar compras',
    };
  }

  if (editDeadlineExpired && !isAdmin && !canCorrectLatePrice) {
    return {
      allowed: false,
      reason: 'deadline',
      title: 'Plazo de edición vencido',
      message: PURCHASE_EDIT_DEADLINE_MESSAGE,
      tooltip: 'El plazo de edición de esta compra ha vencido',
      ariaLabel: 'Editar compra no disponible: plazo de edición vencido',
    };
  }

  return {
    allowed: true,
    reason: null,
    title: '',
    message: '',
    tooltip: 'Editar compra',
    ariaLabel: 'Editar compra',
  };
};
