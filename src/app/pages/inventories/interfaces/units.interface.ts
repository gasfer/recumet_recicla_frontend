import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllUnits {
    ok:    boolean;
    units: Units;
}

export interface Units {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Unit[];
}

export interface Unit {
    id:        number;
    name:      string;
    siglas:    string;
    status:    boolean;
    createdAt: string;
    updatedAt: string;
    options?:  Options[];
}
