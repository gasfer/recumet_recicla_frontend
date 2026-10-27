export interface PurchasePricingDecision {
  requiresAuthorization: boolean;
  reason: string;
  hasPriceChanges: boolean;
  isPriceOnly: boolean;
  editWindowExpired: boolean;
}

export const PRICE_EDIT_GRACE_DAYS = 7;
export const PURCHASE_EDIT_WINDOW_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const PURCHASE_EDIT_AUTHORIZATION_REQUIRED_CODE = 'PURCHASE_EDIT_AUTHORIZATION_REQUIRED';

interface PurchaseAuthorizationError {
  error?: { code?: unknown; errors?: Array<{ msg?: unknown }> };
}

export const isPurchaseEditAuthorizationRequired = (error: unknown): boolean => (
  typeof error === 'object' && error !== null
  && (error as PurchaseAuthorizationError).error?.code === PURCHASE_EDIT_AUTHORIZATION_REQUIRED_CODE
);

export const purchaseEditAuthorizationMessage = (error: unknown): string => {
  if (!isPurchaseEditAuthorizationRequired(error)) return '';
  const message = (error as PurchaseAuthorizationError).error?.errors?.[0]?.msg;
  return typeof message === 'string' && message.trim()
    ? message : 'Esta edición requiere un motivo y un responsable de autorización.';
};

interface PurchaseDetailLike {
  id_product?: unknown;
  id?: unknown;
  quantity?: unknown;
  cost?: unknown;
  costo?: unknown;
  total?: unknown;
  import?: unknown;
  status?: unknown;
  expiration_date?: unknown;
  profit_margin?: unknown;
  product?: { id?: unknown };
}

interface PurchaseLike {
  createdAt?: unknown;
  date_voucher?: unknown;
  detailsInput?: PurchaseDetailLike[];
  accounts_payable?: { monto_abonado?: unknown } | null;
}

const protectedFields = [
  'date_voucher', 'type', 'type_payment', 'type_registry', 'registry_number',
  'account_input', 'comments', 'discount', 'is_paid', 'id_scales', 'id_storage',
  'id_provider', 'id_bank', 'id_sucursal', 'referral_sources', 'old_customer',
  'with_pickup', 'number_transaction', 'status',
] as const;
const normalize = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return null;
  if (value === true || value === false) return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return /^-?\d+(\.\d+)?$/.test(String(value)) ? Number(value) : value;
};
const dateValue = (value: unknown): number => value instanceof Date
  ? value.getTime()
  : new Date(value as string | number).getTime();
const equal = (field: string, before: unknown, after: unknown): boolean => (
  field === 'date_voucher' ? dateValue(before) === dateValue(after)
    : JSON.stringify(normalize(before)) === JSON.stringify(normalize(after))
);
const productId = (detail: PurchaseDetailLike): number => Number(detail.id_product ?? detail.product?.id ?? detail.id);
const cost = (detail: PurchaseDetailLike): unknown => detail.cost ?? detail.costo;

export const isUnpricedPurchase = (purchase: PurchaseLike | null | undefined): boolean => {
  const details = purchase?.detailsInput ?? [];
  return details.length > 0 && details.every(detail => Number(cost(detail) || 0) === 0);
};

export const purchasePricingWindowReason = (
  createdAt: unknown,
  now: string | number | Date = new Date(),
): string | null => {
  const created = dateValue(createdAt);
  const current = dateValue(now);
  if (!Number.isFinite(created) || !Number.isFinite(current)) return 'invalid-pricing-window';
  if (created > current) return 'future-created-at';
  return current - created <= PRICE_EDIT_GRACE_DAYS * DAY_IN_MS ? null : 'pricing-window-expired';
};

export const resolvePurchasePricingDecision = (
  originalPurchase: PurchaseLike | null | undefined,
  currentInput: Record<string, unknown>,
  currentDetails: PurchaseDetailLike[],
  actorRole = '',
  now: string | number | Date = new Date(),
): PurchasePricingDecision => {
  const purchase = originalPurchase ?? {};
  const originalDetails = purchase.detailsInput ?? [];
  const originalInput = purchase as Record<string, unknown>;
  const originalByProduct = new Map(originalDetails.map(detail => [productId(detail), detail]));
  let hasPriceChanges = false;
  let hasNonPriceChanges = originalDetails.length !== currentDetails.length
    || originalByProduct.size !== originalDetails.length;
  const seenProducts = new Set<number>();
  for (const current of currentDetails) {
    const id = productId(current);
    const previous = originalByProduct.get(id);
    if (!previous || seenProducts.has(id)) {
      hasNonPriceChanges = true;
      continue;
    }
    seenProducts.add(id);
    if (!equal('cost', cost(previous), cost(current))) hasPriceChanges = true;
    for (const field of ['quantity', 'status', 'expiration_date', 'profit_margin']) {
      if (!equal(field, previous[field as keyof PurchaseDetailLike], current[field as keyof PurchaseDetailLike])) hasNonPriceChanges = true;
    }
  }
  for (const field of protectedFields) {
    if (currentInput[field] !== undefined && !equal(field, originalInput[field], currentInput[field])) hasNonPriceChanges = true;
  }
  const originalPayment = purchase.accounts_payable?.monto_abonado ?? 0;
  if (currentInput['on_account'] !== undefined && !equal('on_account', originalPayment, currentInput['on_account'])) hasNonPriceChanges = true;
  const createdAt = dateValue(purchase.createdAt);
  const currentTime = dateValue(now);
  const age = Number.isFinite(createdAt) && Number.isFinite(currentTime) && createdAt <= currentTime
    ? (currentTime - createdAt) / DAY_IN_MS : null;
  const editDate = dateValue(purchase.date_voucher);
  const editAge = Number.isFinite(editDate) && Number.isFinite(currentTime) && editDate <= currentTime
    ? (currentTime - editDate) / DAY_IN_MS : null;
  const editWindowExpired = editAge === null || editAge > PURCHASE_EDIT_WINDOW_DAYS;
  const isAdmin = actorRole === 'ADMINISTRADOR';
  const isCajaWithinGrace = actorRole === 'LIQUIDACION_CAJA' && age !== null && age <= PRICE_EDIT_GRACE_DAYS;
  const requiresAuthorization = hasPriceChanges && !isAdmin && !isCajaWithinGrace;
  const isPriceOnly = hasPriceChanges && !hasNonPriceChanges;
  const reason = !hasPriceChanges ? 'no-price-change' : isAdmin ? 'administrator-price-edit'
    : isCajaWithinGrace ? 'liquidation-price-edit-within-seven-days'
      : age === null ? 'invalid-pricing-age'
        : age > PRICE_EDIT_GRACE_DAYS ? 'pricing-window-expired' : 'role-requires-price-authorization';
  return { requiresAuthorization, reason, hasPriceChanges, isPriceOnly, editWindowExpired };
};
