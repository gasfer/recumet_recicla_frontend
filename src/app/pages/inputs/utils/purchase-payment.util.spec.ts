import { normalizePurchasePaymentData, resetPaymentFieldsForCondition } from './purchase-payment.util';

describe('purchase payment state', () => {
  it('clears credit-only and payment metadata when switching from credit to cash', () => {
    const previous = { pay_to_credit: true, ...resetPaymentFieldsForCondition(), on_account: 75,
      type_payment: 'TRANSFERENCIA', account_input: '123', id_bank: 4, number_transaction: 'TX-1' };
    expect({ ...previous, pay_to_credit: false, ...resetPaymentFieldsForCondition() }).toEqual({
      pay_to_credit: false, on_account: 0, type_payment: 'EFECTIVO', account_input: null, id_bank: null, number_transaction: null,
    });
  });

  it('clears contado payment data when switching to credit', () => {
    const previous = { pay_to_credit: false, on_account: 0, type_payment: 'CHEQUE',
      account_input: 'CH-1', id_bank: 3, number_transaction: null };
    expect({ ...previous, pay_to_credit: true, ...resetPaymentFieldsForCondition() }).toEqual({
      pay_to_credit: true, on_account: 0, type_payment: 'EFECTIVO', account_input: null, id_bank: null, number_transaction: null,
    });
  });

  it('never submits a credit advance for a contado purchase', () => {
    const data = normalizePurchasePaymentData({ pay_to_credit: false, on_account: 120, type_payment: 'TRANSFERENCIA',
      account_input: '123', id_bank: 8, number_transaction: 'TX-2' });
    expect(data['on_account']).toBe(0);
    expect(data['type_payment']).toBe('TRANSFERENCIA');
    expect(data['number_transaction']).toBe('TX-2');
  });

  it('removes stale payment fields from credit with no initial payment', () => {
    const data = normalizePurchasePaymentData({ pay_to_credit: true, on_account: 0, type_payment: 'QR',
      account_input: '123', id_bank: 8, number_transaction: 'TX-3' });
    expect(data['pay_to_credit']).toBeTrue();
    expect(data['on_account']).toBe(0);
    expect(data['type_payment']).toBe('EFECTIVO');
    expect(data['account_input']).toBeNull();
    expect(data['id_bank']).toBeNull();
    expect(data['number_transaction']).toBeNull();
  });
});
