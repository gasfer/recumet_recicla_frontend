import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export type TransferStatus = 'PENDING' | 'RECEIVED' | 'ANULADO';
export type TransferReconciliationStatus = 'EN_REVISION' | 'PARCIAL' | 'COMPLETADO';
export type ReceptionCancellationBlockerType =
    | 'OPEN_REVIEW_NOTES'
    | 'OPEN_REVIEW_DETAILS'
    | 'ACTIVE_INVENTORY_HOLDS'
    | 'PENDING_CORRECTIVE_ACTIONS';

export interface GetOneTransfer {
    ok:        boolean;
    transfer: Transfer;
}

export interface GetAllTransfers {
    ok:        boolean;
    transfers: Transfers;
}

export interface Transfers {
    previousPage: null | number;
    currentPage:  number;
    nextPage:     null | number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Transfer[];
    totals:       Totals;
}

export interface Transfer {
    id:                    number;
    cod:                   string;
    date_send:             string;
    date_received:         string | null;
    observations_send:     string;
    observations_received: string | null;
    total:                 string;
    id_sucursal_send:      number;
    id_storage_send:       number;
    id_sucursal_received:  number;
    id_storage_received:   number | null;
    id_user_send:          number;
    id_user_received:      number | null;
    status:                TransferStatus;
    createdAt:             string;
    updatedAt:             string;
    sucursal_send:         StorageReceived;
    sucursal_received:     StorageReceived;
    storage_send:          StorageReceived;
    storage_received:      StorageReceived;
    user_send:             User;
    user_received:         User;
    detailsTransfers:      DetailsTransfer[];
    total_quantity:        number;
    reconciliation_status: TransferReconciliationStatus;
    pending_review_items:  number;
    has_reconciliation_history?: boolean;
    approved_reconciliations?: number;
    reconciliation_history_label?: string;
    review_closure_pending?: boolean;
    open_review_notes?:      OpenTransferReviewNote[];
    reception_dates?: InfoStackItem[];
    origin_destination?: InfoStackItem[];
    reception_observations?: InfoStackItem[];
    transferred_weight?: InfoStackItem[];
    review_note_cards?: Array<{ registry_number: string; type: string; pending_items: number; details: string[]; open: () => void }>;
    reception_cancellation?: ReceptionCancellationAvailability;
    options?:              Options[];
}
export interface ReceptionCancellationAvailability {
    enabled: boolean;
    reason: string | null;
    blockers: ReceptionCancellationBlocker[];
}
export interface ReceptionCancellationBlocker {
    type: ReceptionCancellationBlockerType;
    count: number;
}
export interface TransferCancellationResponse {
    ok: true;
    msg: string;
}
export interface TransferCancellationErrorResponse {
    ok: false;
    code: 'TRANSFER_CANCELLATION_REJECTED' | 'STOCK_KARDEX_PARITY_VIOLATION' | 'RECEPTION_CANCELLATION_FAILED';
    errors: Array<{
        msg: string;
        details?: {
            blockers?: ReceptionCancellationBlocker[];
            product_id?: number;
            sucursal_id?: number;
            storage_id?: number;
            difference?: number;
        } | Array<{
            product_id: number;
            sucursal_id: number;
            storage_id: number;
            difference: number;
        }>;
    }>;
}
export interface InfoStackItem { icon: string; label: string; value: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'; badgeStyle?: { [key: string]: string }; }
export interface OpenTransferReviewNote {
    id: number;
    registry_number: string;
    type: string;
    date: string;
    reconciliation_status: string;
    pending_items: number;
    assignedUser?: { id: number; full_names: string };
    details: Array<{
        id: number;
        quantity_difference: string;
        quantity_resolved: string;
        quantity_remaining: number;
        reconciliation_status: string;
        product?: { id: number; cod: string; name: string };
    }>;
}
interface Totals {
    totalTransfer: number,
    totalQuantity: number,
}
export interface DetailsTransfer {
    id:          number;
    quantity:    string;
    quantity_received: string | null;
    observation: string | null;
    cost:        string;
    total:       string;
    id_transfer: number;
    id_product:  number;
    status:      boolean;
    createdAt:   string;
    updatedAt:   string;
    product:     Product;
}

export interface StorageReceived {
    name: string;
}
export interface Product {
    cod: string;
    name: string;
    description: string;
}

export interface User {
    full_names: string;
}


//** Form Search */
export interface FormSearchTransfers {
    filterBy                :string;
    date1?                  :string;
    date2?                  :string;
    status?                 :string;
    id_sucursal_send?       :number;
    id_storage_send?        :number;
    id_sucursal_received?   :number;
    id_storage_received?    :number;
    id_user_send?           :number;
    id_user_received?       :number;
    inconclusive?           :boolean;
}

//**NEW Transfer FORM */
export interface NewTransformForm {
    transfer_data:    TransferData;
    transfer_details: TransferDetail[];
}

export interface TransferData {
    observations_send:    string;
    total:                number;
    id_sucursal_send:     number;
    id_storage_send:      number;
    id_sucursal_received: number;
}

export interface TransferDetail {
    quantity:   number;
    cost:       number;
    total:      number;
    id_product: number;
    status:     boolean;
}

//**Form to Received transfer */
export interface UpdateTransferToReceived {
    id_transfer:           number;
    id_storage_received:   number;
    observations_received: string;
    date_received?:        Date | string;
    id_merma_product?:     number | null;
    details?:              UpdateTransferDetailReceived[];
}

export interface UpdateTransferDetailReceived {
    id_detail:             number;
    quantity_received:     number;
    observation?:          string;
}

//**form TransferConfig */
export interface TransferConfig {
    searchForCode: boolean, 
    viewCardProducts: boolean,
    printAfter: boolean,
    clearInputAfterProductSearch: boolean,
    viewMoneyButtons: boolean
}
