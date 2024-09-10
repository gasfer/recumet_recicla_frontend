import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllSucursales {
    ok:         boolean;
    sucursales: Sucursales;
}

export interface Sucursales {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Sucursal[];
}

export interface Sucursal {
    id?:        number;
    name:       string;
    email:      string;
    cellphone:  number;
    type:       string;
    city:       string;
    address:    string;
    id_company: null;
    status:     boolean;
    createdAt:  string;
    updatedAt:  string;
    storage:    Storage[];
    options?:   Options[];
    select?:    boolean;
}

export interface Storage {
    id: number;
    name: string;
    id_sucursal: number;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}


