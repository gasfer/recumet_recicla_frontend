import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllScales {
    ok:     boolean;
    scales: Scales;
}

export interface Scales {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Scale[];
}

export interface Scale {
    id:        number;
    name:      string;
    status:    boolean;
    createdAt: string;
    updatedAt: string;
    options?:  Options[];
}
