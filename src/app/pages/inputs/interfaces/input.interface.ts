import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";
import { Category, Unit } from "../../inventories/interfaces/products.interface";
import { Provider } from "./provider.interface";

export interface InputConfig {
    searchForCode: boolean, 
    viewCardProducts: boolean,
    printAfter: boolean,
    clearInputAfterProductSearch: boolean,
    viewMoneyButtons: boolean
}

export interface NewInputForm {
    input_data:    InputData;
    input_details: InputDetail[];
}

export interface InputData {
    date_voucher:    string;
    type:            string;
    type_payment:    string;
    type_registry:   string;
    registry_number: string;
    account_input:   string;
    comments:        string;
    discount:        number;
    sumas:           number;
    total:           number;
    is_paid:         string;
    id_scales:       number;
    id_storage:      number;
    id_provider:     number;
    id_bank:         number;
    id_sucursal:     number;
    status:          string;
    pay_to_credit:   boolean;
    on_account:      number;
}

export interface InputDetail {
    quantity:   number;
    cost:       number;
    total:      number;
    id_product: number;
    status:     string;
}

//** GET ALL INPUTS */
export interface GetAllInputs {
    ok:     boolean;
    inputs: Inputs;
}

export interface Inputs {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Input[];
}

export interface Input {
    id:              number;
    cod:             string;
    date_voucher:    string;
    type:            string;
    type_payment:    string;
    type_registry:   string;
    registry_number: string;
    account_input:   null | string;
    comments:        null | string;
    sumas:           string;
    discount:        string;
    total:           string;
    is_paid:         string;
    id_scales:       number;
    id_storage:      number;
    id_provider:     number;
    id_bank:         null;
    id_user:         number;
    id_sucursal:     number;
    status:          string;
    createdAt:       string;
    updatedAt:       string;
    sucursal:        Sucursal;
    storage:         Storage;
    bank:            Bank;
    accounts_payable:AccountsPayable;
    provider:        Provider;
    scale:           Scale;
    user:            User;
    detailsInput:    DetailsInput[];
    options?:        Options[];
}

export interface DetailsInput {
    quantity:        string;
    cost:            string;
    total:           string;
    expiration_date: null;
    profit_margin:   null;
    product:         Product;
}

export interface Product {
    id: number;
    cod:           string;
    name:          string;
    description:   string;
    costo:         string;
    inventariable: boolean;
    category:      Category;
    unit:          Unit;
    img:           string;
}

export interface Scale {
    name: string;
}
export interface Sucursal {
    name: string;
}
export interface Storage {
    name: string;
}
export interface User {
    full_names:      string;
    number_document: string;
}

export interface Bank {
    id:        string;
    name:      string;
    status:    string;
    createdAt: string;
    updatedAt: string;
}
export interface AccountsPayable {
    id:             number;
    cod:            string;
    date_credit:    string;
    description:    string;
    id_input:       number;
    id_provider:    number;
    monto_abonado:  number;
    monto_restante: number;
    status:         boolean;
    status_account: string;
    total:          number;
    createdAt:      string;
    updatedAt:      string;
    abonosAccountsPayable: AbonosAccountsPayable[];
}

interface AbonosAccountsPayable {
    id:                 number;
    date_abono:         string
    id_account_payable: number;
    monto_abono:        number;
    id_user:            number;
    restante_credito:   number;
    status:             boolean;
    total_abonado:      number;
    createdAt:          string;
    updatedAt:          string;
}

//** Form Search */
export interface FormSearchInputs {
    status:        string;
    type_pay:      string;
    id_storage:    string;
    id_sucursal:   string;
    filterBy:      string;
    date1:         string;
    date2:         string;
    type_registry: string;
    id_provider:   string;
}