export interface PurchasePaymentFields {
  on_account: number;
  type_payment: string;
  account_input: string | null;
  id_bank: number | null;
  number_transaction: string | null;
}

export function resetPaymentFieldsForCondition(): PurchasePaymentFields {
  return {
    on_account: 0,
    type_payment: 'EFECTIVO',
    account_input: null,
    id_bank: null,
    number_transaction: null,
  };
}

export function normalizePurchasePaymentData<T extends object>(inputData: T): T {
  const data = inputData as Record<string, any>;
  const isCredit = Boolean(data['pay_to_credit']);
  const initialPayment = Number(data['on_account'] || 0);
  data['on_account'] = isCredit ? initialPayment : 0;

  if (isCredit && initialPayment <= 0) data['type_payment'] = 'EFECTIVO';
  if (data['type_payment'] === 'EFECTIVO') {
    data['account_input'] = null;
    data['id_bank'] = null;
    data['number_transaction'] = null;
  } else if (data['type_payment'] === 'CHEQUE') {
    data['number_transaction'] = null;
  }

  return inputData;
}
