import {
  PURCHASE_EDIT_DEADLINE_MESSAGE,
  PURCHASE_EDIT_PERMISSION_MESSAGE,
  isPurchaseEditPermissionDenied,
  resolvePurchaseEditEligibility,
} from './purchase-edit-access';

describe('resolvePurchaseEditEligibility', () => {
  it('allows editing when the user has permission and the deadline is active', () => {
    expect(resolvePurchaseEditEligibility(true, false)).toEqual(jasmine.objectContaining({
      allowed: true,
      reason: null,
    }));
  });

  it('blocks editing without permission and explains the required action', () => {
    expect(resolvePurchaseEditEligibility(false, false)).toEqual(jasmine.objectContaining({
      allowed: false,
      reason: 'permission',
      message: PURCHASE_EDIT_PERMISSION_MESSAGE,
    }));
  });

  it('blocks editing when the deadline has expired', () => {
    expect(resolvePurchaseEditEligibility(true, true)).toEqual(jasmine.objectContaining({
      allowed: false,
      reason: 'deadline',
      message: PURCHASE_EDIT_DEADLINE_MESSAGE,
    }));
  });

  it('prioritizes the missing permission when both restrictions apply', () => {
    expect(resolvePurchaseEditEligibility(false, true).reason).toBe('permission');
  });

  it('recognizes only an HTTP 403 as a concurrent permission denial', () => {
    expect(isPurchaseEditPermissionDenied({ status: 403 })).toBeTrue();
    expect(isPurchaseEditPermissionDenied({ status: 422 })).toBeFalse();
    expect(isPurchaseEditPermissionDenied(null)).toBeFalse();
  });
});
