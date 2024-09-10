import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllTransportCompany {
    ok:               boolean;
    trasport_company: TransportCompanies;
}

export interface TransportCompanies {
    previousPage: number | null;
    currentPage:  number;
    nextPage:     number | null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         TransportCompany[];
}

export interface TransportCompany {
    id:           number;
    name:         string;
    nit:          null | string;
    city:         null | string;
    address:      null | string;
    cellphone:    number | null;
    status:       boolean;
    createdAt:    string;
    updatedAt:    string;
    options?:     Options[];
    chauffeurs:   Chauffeur[];
    cargo_trucks: CargoTruck[];
}

export interface CargoTruck {
    id:                  number;
    placa:               string;
    id_trasport_company: number;
    status:              boolean;
    createdAt:           string;
    updatedAt:           string;
    options?:     Options[];
}

export interface Chauffeur {
    id:                  number;
    full_names:          string;
    number_document:     string;
    id_trasport_company: number;
    status:              boolean;
    createdAt:           string;
    updatedAt:           string;
    options?:     Options[];
}

export interface NewCargoTruck {
    placa: string;
    id_trasport_company: number;
    status: boolean;
}

export interface NewChauffeur {
    full_names: string;
    number_document: string;
    id_trasport_company: number;
    status: boolean;
}