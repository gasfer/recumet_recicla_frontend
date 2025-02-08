import { Output } from "../../outputs/interfaces/output.interface";

export interface GetAllAccountsPayableForClient {
    ok:              boolean;
    accountsReceivable: AccountsPayableClient;
}

export interface AccountsPayableClient {
    totals: Totals;
    data:   Account[];
}

interface Account {
    id:             number;
    cod:            string;
    id_input:       number;
    id_provider:    number;
    description:    string;
    date_credit:    Date;
    total:          string;
    monto_abonado:  string;
    monto_restante: string;
    id_sucursal:    number;
    status_account: string;
    status:         boolean;
    createdAt:      Date;
    updatedAt:      Date;
    output:          Pick<Output,'cod'|'date_output'|'type_registry'|'number_registry'>;
}

interface Totals {
    total_abonados: number;
    total_restante: number;
    total_account:  number;
    total_accounts:  number;
    total_quantity:  number;
}


export interface FormPayMultiple {
    id_provider: number;
    monto_abono: number;
    date_abono:  Date;
}
