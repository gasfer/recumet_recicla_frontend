import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllCompanies {
    ok:        boolean;
    companies: Companies;
}

export interface Companies {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Company[];
}

export interface Company {
    id:           number;
    name:         string;
    nit:          string;
    razon_social: string;
    activity:     string;
    email:        string;
    cellphone:    number;
    logo:         string;
    address:      string;
    status:       boolean;
    options?:   Options[];
    createdAt:    string;
    updatedAt:    string;
}
