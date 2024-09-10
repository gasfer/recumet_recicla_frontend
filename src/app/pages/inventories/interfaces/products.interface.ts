import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";

export interface GetAllProducts {
    ok:       boolean;
    products: Products;
}

export interface Products {
    previousPage: null | number;
    currentPage:  number;
    nextPage:     null | number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Product[];
}

export interface Product {
    id:            number;
    cod:           string;
    name:          string;
    description:   string;
    costo:         number;
    inventariable: boolean;
    img:           string;
    id_category:   number;
    id_unit:       number;
    status:        boolean;
    createdAt?:     string;
    updatedAt?:     string;
    category:      Category;
    unit:          Unit;
    prices:        Price[];
    stocks?:        Stock[];
    //items frontend required
    options?:      Options[];
    quantity:      number;
    import:        number;
    price_select?: number; 
    total_stock?: number; 
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

export interface Unit {
    id:           number;
    name:         string;
    siglas?:      string;
    status:       boolean;
    createdAt:    string;
    updatedAt:    string;
}
export interface Price {
    id:            number;
    name:          string;
    price:         string;
    profit_margin: string;
    id_product:    number;
    status:        boolean;
    createdAt:     string;
    updatedAt:     string;
    options?:      Options[];
}

interface Stock {
    stock: number,
    stock_min: string,
    sucursal: Sucursal,
    storage: Storages
}

interface Sucursal {
    id: number;
    name: string,
}
interface Storages {
    id: number;
    name: string,
}


export interface NewPrice {
    name: string;
    price: number;
    profit_margin: number;
    id_product: number;
    status: string;
}

export interface PostReturnProduct {
    ok:      boolean;
    product: ProductPostReturn;
}

 interface ProductPostReturn {
    id:            number;
    cod:           string;
    name:          string;
    description:   string;
    costo:         string;
    inventariable: boolean;
    id_category:   number;
    id_unit:       number;
    status:        boolean;
    img:           string;
    updatedAt:     string;
    createdAt:     string;
}

//=============================================================

export interface GetProductSucursals {
    ok:               boolean;
    productSucursals: ProductSucursal[];
}

export interface ProductSucursal {
    id:          number;
    id_product:  number;
    id_sucursal: number;
    status:      boolean;
    createdAt:   Date;
    updatedAt:   Date;
}


export interface FormAssignSucursalesProduct {
    id_product: number;
    id_sucursal: number;
    status: boolean
}
