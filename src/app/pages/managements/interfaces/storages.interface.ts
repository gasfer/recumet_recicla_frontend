import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllStorages {
    ok:       boolean;
    storages: Storages;
}

export interface Storages {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Storage[];
}

export interface Storage {
    id:          number;
    name:        string;
    id_sucursal: number;
    status:      boolean;
    createdAt:   string;
    updatedAt:   string;
    options?:   Options[];
    sucursal:    Sucursal;
}

export interface Sucursal {
    id:         number;
    name:       string;
    email:      string;
    cellphone:  number;
    type:       string;
    city:       string;
    address:    string;
    id_company: number;
    status:     boolean;
    createdAt:  string;
    updatedAt:  string;
}
