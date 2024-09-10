import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllAccountsReceivable {
    ok:                 boolean;
    accountsReceivable: AccountsReceivable;
}

export interface AccountsReceivable {
    previousPage: null | number;
    currentPage:  number;
    nextPage:     null  | number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         AccountReceivable[];
}

export interface AccountReceivable {
    id:                       number;
    cod:                      string;
    id_output:                number;
    id_client:                number;
    description:              string;
    date_credit:              string;
    total:                    number;
    monto_abonado:            number;
    monto_restante:           number;
    id_sucursal:              number;
    status_account:           string;
    status:                   boolean;
    createdAt:                string;
    updatedAt:                string;
    sucursal:                 Sucursal;
    client:                   Client;
    output:                   Output;
    abonosAccountsReceivable: AbonosAccountsReceivable[];
    options?:                 Options[];
}

export interface AbonosAccountsReceivable {
    id:                    number;
    id_account_receivable: number;
    date_abono:            string;
    monto_abono:           number;
    total_abonado:         number;
    restante_credito:      number;
    id_user:               number;
    status:                boolean;
    createdAt:             string;
    updatedAt:             string;
    user:                  User;
}

export interface User {
    full_names:      string;
    number_document: string;
}

export interface Client {
    full_names: string;
}

export interface Output {
    id:                 number;
    cod:                string;
    voucher:            string;
    date_output:        string;
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
    comments:           null;
    type_registry:      string;
    number_registry:    string;
    id_user:            number;
    id_bank:            null;
    id_storage:         number;
    id_client:          number;
    id_scale:           number;
    id_sucursal:        number;
    status:             string;
    createdAt:          string;
    updatedAt:          string;
    scale:              Sucursal;
    user:               User;
}

export interface Sucursal {
    name: string;
}


//search accounts
export interface FormSearchAccountsReceivable {
    status_account:string;
    id_sucursal:   string;
    filterBy:      string;
    date1:         string;
    date2:         string;
    type_registry: string;
    id_client:     string;
}
//new abono
export interface NewAbonoAccountReceivable {
    id_account_receivable: string;
    date_abono:            string;
    monto_abono:           number;
}
//response new abono
export interface ResponseNewAbono {
    ok:                    boolean;
    msg:                   string;
    abonosAccountsReceivable: AbonoAccountsReceivable;
}

export interface AbonoAccountsReceivable {
    id:                    number;
    id_account_receivable: number;
    date_abono:            string;
    monto_abono:           number;
    total_abonado:         number;
    restante_credito:      number;
    id_user:               number;
    status:                boolean;
    updatedAt:             string;
    createdAt:             string;
}