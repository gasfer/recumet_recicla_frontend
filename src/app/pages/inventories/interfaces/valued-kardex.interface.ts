export type KardexValuationStatus = 'VALUED' | 'UNVALUED';

export interface KardexValuation {
  status: KardexValuationStatus;
  reason: string | null;
  applied_unit_cost: number | null;
  input_value: number | null;
  output_value: number | null;
  average_unit_cost_after: number | null;
  balance_value_after: number | null;
}

export interface KardexResponsible {
  id: number;
  name: string | null;
}

export interface KardexOriginalMovement {
  id: number;
  reference: string | null;
}

export interface ValuedKardexMovement {
  index?: number;
  id_product?: number;
  date: Date | string;
  type: 'INPUT' | 'OUTPUT';
  type_movement: string;
  registry_number: string;
  detail: string;
  sub_detail: string;
  quantity_input: string | number;
  quantity_output: string | number;
  saldo: string | number;
  event_type?: string;
  event_label?: string;
  is_reversal?: boolean;
  product: {
    cod: string;
    name: string;
    unit: { name: string; siglas: string };
  };
  sucursal: { name: string; city: string };
  storage: { name: string };
  valuation: KardexValuation;
  responsible: KardexResponsible | null;
  original_movement: KardexOriginalMovement | null;
}
