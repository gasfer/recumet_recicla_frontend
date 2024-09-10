export interface GetAllProductsAndCosts {
    ok:       boolean;
    products: ProductsCosts;
}

export interface ProductsCosts {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         ProductCost[];
}

export interface ProductCost {
    id:          string;
    cod:          string;
    name:         string;
    description:  string;
    productCosts: Costs;
}

export interface Costs {
    cost:  string;
    cost_two:  string;
    cost_tree: string;
}
