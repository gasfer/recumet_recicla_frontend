export interface GetAllKardexes {
    ok:       boolean;
    kardexes: Kardexes;
}

export interface Kardexes {
    previousPage: null;
    currentPage:  number;
    nextPage:     number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Kardex[];
}

export interface Kardex {
    id:                number;
    type:              null | string;
    date:              string;
    detalle:           string;
    detallePrimary:    string;
    cost_price:        string;
    document:          null | string;
    quantity_input:    null | string;
    cost_u_input:      null | string;
    cost_total_input:  null | string;
    quantity_output:   null | string;
    cost_u_output:     null | string;
    price_u_inicial:   null | string;
    cost_total_output: null | string;
    quantity_saldo:    string;
    cost_total_saldo:  string;
    id_product:        number;
    id_input:          number;
    id_provider:       number | null;
    id_output:         number | null;
    id_sucursal:       number;
    id_storage:        number;
    status:            boolean;
    createdAt:         string;
    updatedAt:         string;
    provider:          Provider | null;
    client:            Client | null;
    sucursal:          Sucursal;
    sucursalOriginDestination:  Sucursal;
    storage:           Storage;
    product:           Product;
    productClassified: Product;
}

export interface Product {
    cod:           string;
    name:          string;
    description:   string;
    costo:         string;
    inventariable: boolean;
    img:           string;
    unit:          Unit;
}

export interface Unit {
    name:   string;
    siglas: string;
}

export interface Provider {
    full_names:      string;
    number_document: null | string;
    name_contact:    null | string;
}

export interface Storage {
    name: string;
}


export interface Sucursal {
    name: string;
    city: string;
}
export interface Client {
    id:              number;
    cod:             string;
    full_names:      string;
    number_document: string;
    razon_social:    string | null;
    email:           string | null;
    cellphone:       number;
    business_name:   string | null;
    address:         string | null;
    type:            string;
    photo:           string | null;
    id_sucursal:     number | null;
    status:          boolean;
    createdAt:       Date;
    updatedAt:       Date;
}

export interface Product {
    cod:           string;
    name:          string;
    description:   string;
    costo:         string;
    inventariable: boolean;
    img:           string;
    unit:          Unit;
}

export interface Unit {
    name:   string;
    siglas: string;
}

export interface Storage {
    name: string;
}

export interface Sucursal {
    name: string;
    city: string;
}


export interface FormSearchKardex {
    filterBy:      string;
    date1:         string;
    date2:         string;
    type_kardex:   string;
    id_sucursal:   string;
    id_storage:    string;
    id_provider:   string;
    id_product:    string;
}