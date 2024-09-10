import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface NewClassifiedForm {
    classified_data:    ClassifiedData;
    classified_details: ClassifiedDetail[];
}

export interface ClassifiedData {
    id_scale:         number;
    id_sucursal:      number;
    id_storage:       number;
    id_product:       number;
    cost_product:     number;
    quantity_product: number;
    type_registry:    string;
    number_registry:  string;
    comments:         string;
    status:           string;
}

export interface ClassifiedDetail {
    quantity:   number;
    cost:       number;
    id_product: number;
    status:     string;
}

//** Form Search */
export interface FormSearchClassified {
    status:        string;
    id_storage:    string;
    id_sucursal:   string;
    filterBy:      string;
    date1:         string;
    date2:         string;
    type_registry: string;
    id_product:   string;
}

//** Get all classified */
export interface GetAllClassifieds {
    ok:          boolean;
    classifieds: Classifieds;
}

export interface Classifieds {
    previousPage: number | null;
    currentPage:  number;
    nextPage:     number | null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Classified[];
}

export interface Classified {
    id:                number;
    cod:               string;
    date_classified:   string;
    type_registry:     string;
    number_registry:   string;
    id_user:           number;
    comments:          string;
    id_product:        number;
    cost_product:      string;
    quantity_product:  string;
    id_scale:          number;
    id_storage:        number;
    id_sucursal:       number;
    status:            string;
    createdAt:         string;
    updatedAt:         string;
    sucursal:          ScaleStorageSucursal;
    storage:           ScaleStorageSucursal;
    scale:             ScaleStorageSucursal;
    product:           ScaleStorageSucursal;
    user:              User;
    detailsClassified: DetailsClassified[];
    options?:          Options[];
}

export interface DetailsClassified {
    quantity: string;
    cost:     string;
    product:  Product;
}

export interface Product {
    id:            number;
    cod:           string;
    name:          string;
    description:   string;
    costo:         string;
    inventariable: boolean;
    img:           string;
    category:      Category;
    unit:          Category;
}

export interface Category {
    id:           number;
    name:         string;
    description?: string;
    status:       boolean;
    createdAt:    string;
    updatedAt:    string;
    siglas?:      string;
}

export interface ScaleStorageSucursal {
    name: string;
}

export interface User {
    full_names:      string;
    number_document: string;
}
