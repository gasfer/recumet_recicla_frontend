import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllSectorProviders {
    ok:      boolean;
    sectors: Sectors;
}

export interface Sectors {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Sector[];
}

export interface Sector {
    id:        number;
    name:      string;
    status:    boolean;
    createdAt: string;
    updatedAt: string;
    options?:  Options[];
}
