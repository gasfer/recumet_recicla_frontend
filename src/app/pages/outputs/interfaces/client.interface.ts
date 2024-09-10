import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllClients {
    ok:      boolean;
    clients: Clients;
}

export interface Clients {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Client[];
}

export interface Client {
    id:              number;
    cod:             string;
    full_names:      string;
    number_document: string;
    razon_social:    string;
    email:           string;
    cellphone:       number;
    business_name:   string;
    address:         string;
    type:            string;
    photo:           null;
    id_sucursal:     number;
    status:          boolean;
    createdAt:       string;
    updatedAt:       string;
    options?:        Options[];
}
