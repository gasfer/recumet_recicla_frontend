export type StockReconciliationStatus = 'DETECTADA' | 'EN_INVESTIGACION' | 'LISTA_PARA_REGULARIZAR' | 'RESUELTA';
export type StockReconciliationDirection = 'STOCK_MAYOR_QUE_KARDEX' | 'KARDEX_MAYOR_QUE_STOCK';
export type StockReconciliationStrategy =
  | 'AJUSTAR_AMBOS_AL_CONTEO_FISICO'
  | 'REGISTRAR_KARDEX_OMITIDO'
  | 'AJUSTAR_STOCK_POR_CONTEO'
  | 'VINCULAR_REGULARIZACION_EXISTENTE'
  | 'CONTINUAR_INVESTIGACION';

export interface StockReconciliationCandidateDocument {
  transfer_id: number;
  transfer_cod: string;
  detail_id: number;
  quantity_sent: number | string;
  quantity_received: number | string;
  quantity_difference: number | string;
  review_note_id?: number | null;
  review_note_registry?: string | null;
  review_note_type?: string | null;
  review_note_status?: string | null;
  relation_confidence: 'CANDIDATA' | 'CONFIRMADA';
}

export interface StockReconciliationFilters {
  page: number;
  limit: number;
  id_sucursal?: number | string;
  id_storage?: number | string;
  status?: StockReconciliationStatus;
  direction?: StockReconciliationDirection;
  query?: string;
}

export interface StockReconciliationCase {
  id: number;
  id_product: number;
  id_sucursal: number;
  id_storage: number;
  status: StockReconciliationStatus;
  direction: StockReconciliationDirection;
  physical_stock_observed: number;
  kardex_balance_observed: number;
  difference_observed: number;
  physical_count?: number | null;
  cause?: string | null;
  investigation_notes?: string | null;
  selected_strategy?: StockReconciliationStrategy | null;
  source_reference_type?: string | null;
  source_reference_code?: string | null;
  candidate_documents: StockReconciliationCandidateDocument[];
  product: { id: number; cod: string; name: string };
  sucursal: { id: number; name: string };
  storage: { id: number; name: string };
  assignedUser?: { id: number; full_names: string } | null;
  evidences?: Array<Record<string, any>>;
  events?: Array<Record<string, any>>;
  actions?: Array<Record<string, any>>;
}

export interface StockReconciliationPage {
  data: StockReconciliationCase[];
  total: number;
  page: number;
  limit: number;
}

export interface StockReconciliationPreview {
  case_id: number;
  strategy: StockReconciliationStrategy;
  effect_label: string;
  stock_before: number;
  kardex_before: number;
  difference_before: number;
  stock_after: number;
  kardex_after: number;
  difference_after: number;
  registry_number?: string | null;
  movement?: { type: 'INPUT' | 'OUTPUT'; quantity: number } | null;
  stock_adjustment?: { type: 'INCREASE' | 'DECREASE'; quantity: number } | null;
}

export interface ReconciliationUser { id: number; full_names: string; role: string; }
