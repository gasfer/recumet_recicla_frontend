import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface OutputConfig {
    searchForCode: boolean, 
    viewCardProducts: boolean,
    printAfter: boolean,
    clearInputAfterProductSearch: boolean,
    viewMoneyButtons: boolean
}

export interface NewOutputForm {
    output_data:    OutputData;
    output_big:     OutputBig;
    output_details: OutputDetail[];
}

export interface OutputBig {
    origin: string;
    destination: string;
    id_chauffeur: number;
    id_cargo_truck: number;
    agencia: string;
    trans_mariti: string;
    number_factura: string;
    number_precinto: string;
    poliza_seguro: string;
    type_container: string;
    number_container: string;
}
export interface OutputData {
    type_output:    string;
    type_voucher:   string;
    type_registry:  string;
    number_registry:string;
    id_scale:       number;
    id_sucursal:    number;
    id_storage:     number;
    pay_to_credit:  boolean;
    on_account:     number;
    sub_total:      number;
    discount:       number;
    total:          number;
    type_payment:   string;
    comments:       string;
    id_bank:        number;
    account_output: string;
    id_client:      number;
    status:         string;
}

export interface OutputDetail {
    quantity:   number;
    cost:       number;
    price:      number;
    total:      number;
    id_product: number;
    status:     string;
}


//** Form Search */
export interface FormSearchOutputs {
    status:        string;
    type_pay:      string;
    id_storage:    string;
    id_sucursal:   string;
    filterBy:      string;
    date1:         string;
    date2:         string;
    type_registry: string;
    type_output: string;
    id_client:   string;
}

//** GetAllOutputs */
export interface GetAllOutputs {
    ok:      boolean;
    outputs: Outputs;
}

export interface Outputs {
    previousPage: null | number;
    currentPage:  number;
    nextPage:     null | number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Output[];
}

export interface Output {
    id:                 number;
    cod:                string;
    voucher:            null | string;
    date_output:        null | string;
    total:              string;
    type_voucher:       string;
    type_output:        string;
    type_payment:       string;
    sub_total:          string;
    discount:           string;
    payment_cash:       null;
    payment_linea:      null;
    change_money:       null;
    account_output:     null;
    agreed_date_output: null;
    comments:           string;
    type_registry:      string;
    number_registry:    string;
    id_user:            number;
    id_bank:            null | number;
    id_storage:         number;
    id_client:          null | number;
    id_scale:           number;
    id_sucursal:        number;
    status:             string;
    createdAt:          string;
    updatedAt:          string;
    client:             Client;
    sucursal:           Scale;
    storage:            Scale;
    scale:              Scale;
    user:               User;
    bank:               Bank;
    detailsOutput:      DetailsOutput[];
    outputBig:          OutputBig;    
    accounts_receivable: AccountsReceivable;
    options?:           Options[];
}

export interface AccountsReceivable {
    id:                       number;
    cod:                      string;
    id_output:                number;
    id_client:                number;
    description:              string;
    date_credit:              string;
    total:                    string;
    monto_abonado:            string;
    monto_restante:           string;
    status_account:           string;
    status:                   boolean;
    createdAt:                string;
    updatedAt:                string;
    abonosAccountsReceivable: AbonosAccountsReceivable[];
}

export interface AbonosAccountsReceivable {
    id:                 number;
    id_account_receiva: number;
    date_abono:         string;
    monto_abono:        string;
    total_abonado:      string;
    restante_credito:   string;
    id_user:            number;
    status:             boolean;
    createdAt:          string;
    updatedAt:          string;
}


export interface OutputBig {
    id:                number;
    id_output:         number;
    origin:            string;
    destination:       string;
    id_chauffeur:      number;
    id_cargo_truck:    number;
    agencia:           string;
    trans_mariti:      string;
    number_factura:    string;
    number_precinto:   string;
    poliza_seguro:    string;
    type_container:    string;
    number_contenedor: string;
    createdAt:         string;
    updatedAt:         string;
    chauffeur:         Chauffeur;
    cargo_truck:       CargoTruck;
}

export interface CargoTruck {
    id:                  number;
    placa:               string;
    id_trasport_company: number;
    status:              boolean;
    createdAt:           string;
    updatedAt:           string;
}

export interface Chauffeur {
    id:                  number;
    full_names:          string;
    number_document:     string;
    id_trasport_company: number;
    status:              boolean;
    createdAt:           string;
    updatedAt:           string;
    trasport_company:    TrasportCompany;
}

export interface TrasportCompany {
    id:        number;
    name:      string;
    nit:       null;
    city:      null;
    address:   null;
    cellphone: null;
    status:    boolean;
    createdAt: string;
    updatedAt: string;
}


export interface DetailsOutput {
    quantity: string;
    cost:     string;
    price:    string;
    total:    string;
    product:  Product;
}

export interface Product {
    id:            number;
    cod:           string;
    name:          string;
    description:   string;
    costo:         string;
    inventariable: boolean;
    img:           string;
    category:      Category;
    unit:          Category;
    prices: Price[];
}

interface Price {
    id: number,
    name: string,
    price: string,
    profit_margin: string,
    id_product: number,
    status: boolean,
    createdAt: string,
    updatedAt: string
}
export interface Category {
    id:           number;
    name:         string;
    description?: string;
    status:       boolean;
    createdAt:    string;
    updatedAt:    string;
    siglas?:      string;
}

 interface Scale {
    name: string;
}

 interface User {
    full_names:      string;
    number_document: string;
}
export interface Client {
    id:              number;
    cod:             string;
    full_names:      string;
    number_document: string;
    razon_social:    string | null;
    email:           string | null;
    cellphone:       number | null;
    business_name:   string | null;
    address:         string | null;
    type:            string;
    photo:           string | null;
    id_sucursal:     number | null;
    status:          boolean;
    createdAt:       string;
    updatedAt:       string;
}

interface Bank {
    name: string;
}
