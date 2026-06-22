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
    type:        string;
    status:      boolean;
    createdAt?:  string;
    updatedAt?:  string;
    options?:    Options[];
}

export enum CategoryType {
    RAW_MATERIAL = 'RAW_MATERIAL',
    FINISHED_PRODUCT = 'FINISHED_PRODUCT',
    RESALE_ITEM = 'RESALE_ITEM'
}
