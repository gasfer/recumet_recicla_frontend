import {
  isPurchaseEditAuthorizationRequired,
  isUnpricedPurchase,
  purchaseEditAuthorizationMessage,
  resolvePurchasePricingDecision,
} from './purchase-pricing-authorization';

const purchase = {
  id_provider: 4,
  id_sucursal: 2,
  id_storage: 3,
  id_scales: 1,
  createdAt: '2026-09-03T13:00:00.000Z',
  date_voucher: '2026-09-03T13:46:00.000Z',
  type: 'CONTADO',
  type_payment: 'EFECTIVO',
  type_registry: 'SIN FICHA',
  registry_number: 'SFC-07208',
  discount: 0,
  status: 'ACTIVE',
  accounts_payable: null,
  detailsInput: [
    { product: { id: 10 }, quantity: '5', cost: null, total: 0 },
    { product: { id: 20 }, quantity: 3, cost: '0', total: '0' },
  ],
};

const input = {
  id_provider: 4,
  id_sucursal: 2,
  id_storage: 3,
  id_scales: 1,
  date_voucher: new Date('2026-09-03T13:46:00.000Z'),
  pay_to_credit: false,
  type_payment: 'EFECTIVO',
  type_registry: 'SIN FICHA',
  registry_number: 'SFC-07208',
  discount: 0,
  on_account: 0,
  status: 'ACTIVE',
  sumas: 65,
  total: 65,
};

const details = [
  { id: 10, quantity: 5, costo: 10, import: 50 },
  { id: 20, quantity: 3, costo: 5, import: 15 },
];

describe('purchase pricing authorization policy', () => {
  it('recognizes only a non-empty purchase whose original prices are all unassigned', () => {
    expect(isUnpricedPurchase(purchase)).toBeTrue();
    expect(isUnpricedPurchase({ detailsInput: [] })).toBeFalse();
    expect(isUnpricedPurchase({ detailsInput: [{ cost: 1 }] })).toBeFalse();
  });

  it('does not require additional authorization for initial pricing only', () => {
    expect(resolvePurchasePricingDecision(purchase, input, details, '2026-09-04T12:59:59.000Z')).toEqual({
      requiresAuthorization: false,
      reason: 'initial-pricing',
    });
  });

  it('allows pending costs in a partially priced purchase and preserves priced costs', () => {
    const partiallyPriced = { ...purchase, detailsInput: [{ ...purchase.detailsInput[0], cost: 2 }, purchase.detailsInput[1]] };
    const currentDetails = [{ ...details[0], costo: 2, import: 10 }, details[1]];
    expect(resolvePurchasePricingDecision(partiallyPriced, { ...input, sumas: 25, total: 25 }, currentDetails, '2026-09-03T14:00:00.000Z').requiresAuthorization).toBeFalse();
    expect(resolvePurchasePricingDecision(partiallyPriced, input, details, '2026-09-03T14:00:00.000Z').reason).toBe('previous-price-changed');
  });

  it('allows partial regularization but requires at least one completed pending cost', () => {
    expect(resolvePurchasePricingDecision(
      purchase,
      { ...input, sumas: 50, total: 50 },
      [details[0], { id: 20, quantity: 3, costo: 0, import: 0 }],
      '2026-09-03T14:00:00.000Z',
    ).requiresAuthorization).toBeFalse();
    expect(resolvePurchasePricingDecision(
      purchase,
      { ...input, sumas: 0, total: 0 },
      [{ id: 10, quantity: 5, costo: 0, import: 0 }, { id: 20, quantity: 3, costo: 0, import: 0 }],
      '2026-09-03T14:00:00.000Z',
    ).reason).toBe('no-pending-price-completed');
  });

  it('requires authorization outside 24 hours or with invalid server creation time', () => {
    expect(resolvePurchasePricingDecision(purchase, input, details, '2026-09-04T13:00:00.001Z').reason).toBe('pricing-window-expired');
    expect(resolvePurchasePricingDecision({ ...purchase, createdAt: undefined }, input, details, '2026-09-03T14:00:00.000Z').reason).toBe('invalid-pricing-window');
    expect(resolvePurchasePricingDecision({ ...purchase, createdAt: '2026-09-03T15:00:00.000Z' }, input, details, '2026-09-03T14:00:00.000Z').reason).toBe('future-created-at');
  });

  it('requires authorization for changes beyond derived prices and totals', () => {
    const now = '2026-09-03T14:00:00.000Z';
    expect(resolvePurchasePricingDecision(purchase, { ...input, id_provider: 99 }, details, now).requiresAuthorization).toBeTrue();
    expect(resolvePurchasePricingDecision(purchase, input, [{ ...details[0], quantity: 6, import: 60 }, details[1]], now).requiresAuthorization).toBeTrue();
    expect(resolvePurchasePricingDecision(purchase, input, [{ ...details[0], id: 99 }, details[1]], now).requiresAuthorization).toBeTrue();
    expect(resolvePurchasePricingDecision(purchase, { ...input, discount: 5 }, details, now).requiresAuthorization).toBeTrue();
    expect(resolvePurchasePricingDecision(purchase, { ...input, pay_to_credit: true }, details, now).requiresAuthorization).toBeTrue();
    expect(resolvePurchasePricingDecision(purchase, { ...input, on_account: 10 }, details, now).requiresAuthorization).toBeTrue();
    expect(resolvePurchasePricingDecision(purchase, input, [details[0], { ...details[1], id: 10 }], now).requiresAuthorization).toBeTrue();
  });

  it('recognizes a server reclassification and exposes its contextual message', () => {
    const error = { error: { code: 'PURCHASE_EDIT_AUTHORIZATION_REQUIRED', errors: [{ msg: 'Seleccione un responsable.' }] } };
    expect(isPurchaseEditAuthorizationRequired(error)).toBeTrue();
    expect(purchaseEditAuthorizationMessage(error)).toBe('Seleccione un responsable.');
    expect(isPurchaseEditAuthorizationRequired({ status: 422 })).toBeFalse();
  });
});
