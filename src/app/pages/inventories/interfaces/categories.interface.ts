import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllCategories {
    ok:         boolean;
    categories: Categories;
}

export interface Categories {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Category[];
}

export interface Category {
    id?:         number;
    name:        string;
    description: string;
    status:      boolean;
    createdAt?:  string;
    updatedAt?:  string;
    options?:    Options[];
}
