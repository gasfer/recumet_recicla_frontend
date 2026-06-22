import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllAbonosReceivableAccountAll {
    ok:                     boolean;
    accountsReceivablesAll: AccountsReceivablesAll;
}

export interface AccountsReceivablesAll {
    previousPage: null  | number;
    currentPage:  number;
    nextPage:     number;
    total:        number;
    total_all:    number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         AccountsReceivableAll[];
    totals:    Totals;
}
interface Totals {
    total_abonados: number,
}

export interface AccountsReceivableAll {
    id:                      number;
    ids_account_receivables: number[];
    ids_abonos_receivables:  number[];
    codes_output:          string[];
    date_abono:              Date;
    monto_abono:             string;
    id_user:                 number;
    id_client:               number;
    comments:                null;
    type_payment:            string;
    account_input:           null | string;
    id_bank:                 number | null;
    id_sucursal:             number;
    from_pay_multiple:       boolean;
    createdAt:               Date;
    updatedAt:               Date;
    sucursal:                Sucursal;
    user:                    Client;
    client:                  Client;
    options?:              Options[];
}

export interface Client {
    full_names: string;
}

export interface Sucursal {
    name: string;
}

export interface FormSearchAbonosReceivables {
    id_sucursal:   string;
    filterBy:      string;
    date1:         string;
    date2:         string;
    id_client:   string;
}
