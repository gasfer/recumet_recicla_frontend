import {
  isPurchaseEditAuthorizationRequired,
  isUnpricedPurchase,
  purchaseEditAuthorizationMessage,
  resolvePurchasePricingDecision,
} from './purchase-pricing-authorization';

const now = '2026-10-27T00:00:00.000Z';
const purchase = {
  createdAt: '2026-10-20T00:00:00.000Z',
  date_voucher: '2026-10-20T00:00:00.000Z',
  type: 'CONTADO', type_payment: 'EFECTIVO', id_provider: 4, id_sucursal: 2,
  id_storage: 3, id_scales: 1, type_registry: 'SIN FICHA', registry_number: 'SFC-1',
  discount: 0, status: 'ACTIVE', accounts_payable: null,
  detailsInput: [{ id_product: 10, quantity: 5, cost: 10, total: 50, status: 'ACTIVE' }],
};
const input = { id_provider: 4, id_sucursal: 2, id_storage: 3, id_scales: 1,
  type: 'CONTADO', type_payment: 'EFECTIVO', type_registry: 'SIN FICHA',
  registry_number: 'SFC-1', discount: 0, status: 'ACTIVE', sumas: 60, total: 60 };
const details = [{ id_product: 10, quantity: 5, cost: 12, total: 60, status: 'ACTIVE' }];

describe('resolvePurchasePricingDecision', () => {
  it('lets Administrators change prices without authorization', () => {
    expect(resolvePurchasePricingDecision(purchase, input, details, 'ADMINISTRADOR', now).requiresAuthorization).toBeFalse();
  });
  it('allows LIQUIDACION_CAJA through the seven-day boundary and requires authorization after', () => {
    expect(resolvePurchasePricingDecision(purchase, input, details, 'LIQUIDACION_CAJA', now).requiresAuthorization).toBeFalse();
    expect(resolvePurchasePricingDecision(purchase, input, details, 'LIQUIDACION_CAJA', '2026-10-27T00:00:00.001Z').requiresAuthorization).toBeTrue();
  });
  it('requires authorization for other roles and detects a price-only edit', () => {
    const result = resolvePurchasePricingDecision(purchase, input, details, 'ENCARGADO', now);
    expect(result.requiresAuthorization).toBeTrue();
    expect(result.isPriceOnly).toBeTrue();
  });
  it('marks edits after thirty days for price-only correction and detects mixed changes', () => {
    const aged = { ...purchase, date_voucher: '2026-09-26T00:00:00.000Z' };
    expect(resolvePurchasePricingDecision(aged, input, details, 'ADMINISTRADOR', now).editWindowExpired).toBeTrue();
    const mixed = [{ ...details[0], quantity: 6, total: 72 }];
    expect(resolvePurchasePricingDecision(aged, input, mixed, 'ADMINISTRADOR', now).isPriceOnly).toBeFalse();
  });
  it('recognizes unset prices and server authorization errors', () => {
    expect(isUnpricedPurchase({ detailsInput: [{ cost: null }, { cost: '0' }] })).toBeTrue();
    const error = { error: { code: 'PURCHASE_EDIT_AUTHORIZATION_REQUIRED', errors: [{ msg: 'Autorización' }] } };
    expect(isPurchaseEditAuthorizationRequired(error)).toBeTrue();
    expect(purchaseEditAuthorizationMessage(error)).toBe('Autorización');
  });
});
