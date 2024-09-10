import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

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
}

export interface Transfer {
    id:                    number;
    cod:                   string;
    date_send:             string;
    date_received:         string;
    observations_send:     string;
    observations_received: string;
    total:                 string;
    id_sucursal_send:      number;
    id_storage_send:       number;
    id_sucursal_received:  number;
    id_storage_received:   number;
    id_user_send:          number;
    id_user_received:      number;
    status:                string;
    createdAt:             string;
    updatedAt:             string;
    sucursal_send:         StorageReceived;
    sucursal_received:     StorageReceived;
    storage_send:          StorageReceived;
    storage_received:      StorageReceived;
    user_send:             User;
    user_received:         User;
    detailsTransfers:      DetailsTransfer[];
    options?:             Options[];

}

export interface DetailsTransfer {
    id:          number;
    quantity:    string;
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
    date1                   :string;
    date2                   :string;
    status?                 :string;
    id_sucursal_send?       :number;
    id_storage_send?        :number;
    id_sucursal_received?   :number;
    id_storage_received?    :number;
    id_user_send?           :number;
    id_user_received?       :number;
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
}

//**form TransferConfig */
export interface TransferConfig {
    searchForCode: boolean, 
    viewCardProducts: boolean,
    printAfter: boolean,
    clearInputAfterProductSearch: boolean,
    viewMoneyButtons: boolean
}
