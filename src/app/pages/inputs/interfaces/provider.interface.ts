import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";
import { Sector } from "./sector.interface";

export interface GetAllProviders {
    ok:        boolean;
    providers: Providers;
}

export interface Providers {
    previousPage: number | null;
    currentPage:  number;
    nextPage:     number | null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Provider[];
}

export interface Provider {
    id:                number;
    full_names:        string;
    number_document:   string;
    cellphone:         number;
    direction:         string;
    mayorista:         boolean;
    name_contact:      string;
    cellphone_contact: number;
    id_category:       number;
    id_sucursal:       null;
    status:            boolean;
    createdAt:         string;
    updatedAt:         string;
    category:          Category;
    sector:            Sector;
    type:              Type | null;
    options?:          Options[];
}

interface Type {
    id: number,
    name: string,
    code: string,
    status: boolean,
    createdAt: string,
    updatedAt: string
}
interface Category {
    id:          number;
    name:        string;
    description: string;
    status:      boolean;
    createdAt:   string;
    updatedAt:   string;
}


export interface GetAllTypesProvider {
    ok:            boolean;
    typesProvider: TypesProvider[];
}

export interface TypesProvider {
    id:        number;
    name:      string;
    code:      string;
    status:    boolean;
    createdAt: Date;
    updatedAt: Date;
}
