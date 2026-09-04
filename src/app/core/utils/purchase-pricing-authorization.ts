export interface PurchasePricingDecision {
  requiresAuthorization: boolean;
  reason: string;
}

export const INITIAL_PRICING_GRACE_HOURS = 24;
const HOUR_IN_MS = 60 * 60 * 1000;

export const PURCHASE_EDIT_AUTHORIZATION_REQUIRED_CODE = 'PURCHASE_EDIT_AUTHORIZATION_REQUIRED';

interface PurchaseAuthorizationError {
  error?: {
    code?: unknown;
    errors?: Array<{ msg?: unknown }>;
  };
}

export const isPurchaseEditAuthorizationRequired = (error: unknown): boolean => (
  typeof error === 'object'
  && error !== null
  && (error as PurchaseAuthorizationError).error?.code === PURCHASE_EDIT_AUTHORIZATION_REQUIRED_CODE
);

export const purchaseEditAuthorizationMessage = (error: unknown): string => {
  if (!isPurchaseEditAuthorizationRequired(error)) return '';
  const message = (error as PurchaseAuthorizationError).error?.errors?.[0]?.msg;
  return typeof message === 'string' && message.trim()
    ? message
    : 'Esta edición requiere un motivo y un responsable de autorización.';
};

interface PurchaseDetailLike {
  id_product?: unknown;
  id?: unknown;
  quantity?: unknown;
  cost?: unknown;
  costo?: unknown;
  total?: unknown;
  import?: unknown;
  product?: { id?: unknown };
}

interface PurchaseLike {
  createdAt?: unknown;
  detailsInput?: PurchaseDetailLike[];
  accounts_payable?: { monto_abonado?: unknown } | null;
}

const protectedFields = [
  'date_voucher', 'type_payment', 'type_registry', 'registry_number',
  'account_input', 'comments', 'discount', 'is_paid', 'id_scales',
  'id_storage', 'id_provider', 'id_bank', 'id_sucursal', 'referral_sources',
  'old_customer', 'with_pickup', 'number_transaction', 'status',
] as const;

const normalize = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return null;
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return /^-?\d+(\.\d+)?$/.test(String(value)) ? Number(value) : value;
};

const normalizeDate = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return null;
  const timestamp = new Date(value as string | number | Date).getTime();
  return Number.isNaN(timestamp) ? String(value) : timestamp;
};

const equal = (field: string, before: unknown, after: unknown): boolean => (
  field === 'date_voucher'
    ? normalizeDate(before) === normalizeDate(after)
    : JSON.stringify(normalize(before)) === JSON.stringify(normalize(after))
);

const originalProductId = (detail: PurchaseDetailLike): number => Number(detail.id_product ?? detail.product?.id);
const currentProductId = (detail: PurchaseDetailLike): number => Number(detail.id_product ?? detail.id ?? detail.product?.id);
const originalCost = (detail: PurchaseDetailLike): unknown => detail.cost ?? detail.costo;
const currentCost = (detail: PurchaseDetailLike): unknown => detail.cost ?? detail.costo;
const currentTotal = (detail: PurchaseDetailLike): unknown => detail.total ?? detail.import;
const nearlyEqual = (left: unknown, right: unknown): boolean => Math.abs(Number(left) - Number(right)) <= 0.0001;

export const isUnpricedPurchase = (purchase: PurchaseLike | null | undefined): boolean => {
  const details = purchase?.detailsInput ?? [];
  return details.length > 0 && details.every(detail => {
    const value = originalCost(detail);
    return value === null || value === undefined || value === '' || (Number.isFinite(Number(value)) && Number(value) === 0);
  });
};

export const purchasePricingWindowReason = (
  createdAt: unknown,
  now: string | number | Date = new Date(),
): string | null => {
  const createdAtTime = new Date(createdAt as string | number | Date).getTime();
  const currentTime = new Date(now).getTime();
  if (!Number.isFinite(createdAtTime) || !Number.isFinite(currentTime)) return 'invalid-pricing-window';
  const elapsed = currentTime - createdAtTime;
  if (elapsed < 0) return 'future-created-at';
  return elapsed <= INITIAL_PRICING_GRACE_HOURS * HOUR_IN_MS ? null : 'pricing-window-expired';
};

export const resolvePurchasePricingDecision = (
  originalPurchase: PurchaseLike | null | undefined,
  currentInput: Record<string, unknown>,
  currentDetails: PurchaseDetailLike[],
  now: string | number | Date = new Date(),
): PurchasePricingDecision => {
  const originalDetails = originalPurchase?.detailsInput ?? [];
  const originalInput = originalPurchase as unknown as Record<string, unknown> | null | undefined;
  if (!originalDetails.some(detail => {
    const value = originalCost(detail);
    return value === null || value === undefined || value === '' || (Number.isFinite(Number(value)) && Number(value) === 0);
  })) return { requiresAuthorization: true, reason: 'previously-priced' };
  const windowReason = purchasePricingWindowReason(originalPurchase?.createdAt, now);
  if (windowReason) return { requiresAuthorization: true, reason: windowReason };
  if (originalDetails.length !== currentDetails.length) return { requiresAuthorization: true, reason: 'details-changed' };

  const originalByProduct = new Map(originalDetails.map(detail => [originalProductId(detail), detail]));
  const currentProductIds = currentDetails.map(currentProductId);
  if (originalByProduct.size !== originalDetails.length || new Set(currentProductIds).size !== currentDetails.length) {
    return { requiresAuthorization: true, reason: 'ambiguous-products' };
  }

  const originalType = String(originalInput?.['type'] ?? '');
  const currentType = currentInput['pay_to_credit'] === true ? 'CREDITO' : 'CONTADO';
  if (currentInput['pay_to_credit'] !== undefined && originalType !== currentType) {
    return { requiresAuthorization: true, reason: 'purchase-data-changed' };
  }
  if (protectedFields.some(field => currentInput[field] !== undefined && !equal(field, originalInput?.[field], currentInput[field]))) {
    return { requiresAuthorization: true, reason: 'purchase-data-changed' };
  }
  const originalPayment = originalPurchase?.accounts_payable?.monto_abonado ?? 0;
  if (currentInput['on_account'] !== undefined && !equal('on_account', originalPayment, currentInput['on_account'])) {
    return { requiresAuthorization: true, reason: 'purchase-data-changed' };
  }

  let derivedSum = 0;
  let completedPrices = 0;
  for (const currentDetail of currentDetails) {
    const originalDetail = originalByProduct.get(currentProductId(currentDetail));
    const quantity = Number(currentDetail.quantity);
    const cost = Number(currentCost(currentDetail));
    const total = Number(currentTotal(currentDetail));
    if (!originalDetail
      || !equal('quantity', originalDetail.quantity, currentDetail.quantity)
      || !Number.isFinite(quantity)
      || !Number.isFinite(cost)
      || !Number.isFinite(total)
      || !nearlyEqual(total, quantity * cost)) {
      return { requiresAuthorization: true, reason: 'non-pricing-detail-change' };
    }
    const beforeCost = originalCost(originalDetail);
    if (beforeCost === null || beforeCost === undefined || beforeCost === '' || (Number.isFinite(Number(beforeCost)) && Number(beforeCost) === 0)) {
      if (cost < 0) return { requiresAuthorization: true, reason: 'non-pricing-detail-change' };
      if (cost > 0) completedPrices += 1;
    } else if (!equal('cost', beforeCost, currentCost(currentDetail))) {
      return { requiresAuthorization: true, reason: 'previous-price-changed' };
    }
    derivedSum += total;
  }

  if (!completedPrices) return { requiresAuthorization: true, reason: 'no-pending-price-completed' };

  if (currentInput['sumas'] !== undefined && !nearlyEqual(currentInput['sumas'], derivedSum)) {
    return { requiresAuthorization: true, reason: 'invalid-derived-totals' };
  }
  const discount = Number(originalInput?.['discount'] || 0);
  if (currentInput['total'] !== undefined && !nearlyEqual(currentInput['total'], derivedSum - discount)) {
    return { requiresAuthorization: true, reason: 'invalid-derived-totals' };
  }

  return { requiresAuthorization: false, reason: 'initial-pricing' };
};
