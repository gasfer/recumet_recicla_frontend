import { Input } from "../../inputs/interfaces/input.interface";

export interface GetAllAccountsPayableForProvider {
    ok:              boolean;
    accountsPayable: AccountsPayableProvider;
}

export interface AccountsPayableProvider {
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
    input:          Pick<Input,'cod'|'date_voucher'|'type_registry'|'registry_number'>;
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
    id_sucursal: number;
    date_abono:  Date;
}
