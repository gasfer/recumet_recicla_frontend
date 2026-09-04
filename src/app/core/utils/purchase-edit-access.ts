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

export const isPurchaseEditPermissionDenied = (error: unknown): boolean =>
  typeof error === 'object'
  && error !== null
  && 'status' in error
  && (error as { status?: number }).status === 403;

export const resolvePurchaseEditEligibility = (
  canUpdatePurchases: boolean,
  editDeadlineExpired: boolean,
): PurchaseEditEligibility => {
  if (!canUpdatePurchases) {
    return {
      allowed: false,
      reason: 'permission',
      title: 'Sin permiso para editar',
      message: PURCHASE_EDIT_PERMISSION_MESSAGE,
      tooltip: 'Sin permiso para modificar compras',
      ariaLabel: 'Editar compra no disponible: sin permiso para modificar compras',
    };
  }

  if (editDeadlineExpired) {
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
