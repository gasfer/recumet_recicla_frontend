import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllConsultaCaja {
    ok:          boolean;
    cajas_small: CajasSmall;
}

export interface CajasSmall {
    previousPage: null | number;
    currentPage:  number;
    nextPage:     null | number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         CajaSmall[];
}

export interface CajaSmall {
    id:               number;
    date_apertura:    string;
    monto_apertura:   string;
    monto_cierre:     null | string;
    date_cierre:      null | string;
    id_user:          number;
    id_sucursal:      number;
    status:           Status;
    createdAt:        string;
    updatedAt:        string;
    sucursal:         Sucursal;
    user:             User;
    options?:         Options[];
    total_movements: TotalMovements;
}

export interface TotalMovements {
    id_caja_small:            number;
    total_ingresos:           number | null;
    total_gastos:             number | null;
    saldo:                    number;
    monto_apertura:           number;
    monto_apertura_mas_saldo: number;
    ingresos:                 Gasto[];
    gastos:                   Gasto[];
}

export interface Gasto {
    id:              number;
    id_caja_small:   number;
    date:            string;
    type:            string;
    type_payment:    string;
    id_bank:         null;
    account_payment: null;
    monto:           string;
    description:     string;
    status:          boolean;
    createdAt:       string;
    updatedAt:       string;
}

export enum Status {
    Abierto = "ABIERTO",
    Cierre = "CIERRE",
}

export interface Sucursal {
    name: string;
}

export interface User {
    full_names:      string;
    number_document: string;
}
