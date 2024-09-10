export interface GetAllTotalesMovements {
    ok?:                       boolean;
    id_caja_small:            number;
    total_ingresos:           number | null;
    total_gastos:             number | null;
    monto_apertura:           number;
    monto_apertura_mas_saldo: number;
    saldo:                    number;
    ingresos:                 Detail[];
    gastos:                   Detail[];
}

export interface Detail {
    id:              number;
    id_caja_small:   number;
    date:            string;
    type:            string;
    type_payment:    string;
    id_bank:         null | number;
    account_payment: null | number;
    monto:           string;
    description:     string;
    status:          boolean;
    createdAt:       string;
    updatedAt:       string;
}


export interface FormNewDetail {
    type:         string;
    type_payment: string;
    description:  string;
    monto:        number;
    id_sucursal:  number;
}
