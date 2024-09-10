export interface GetAllPaginateProviderProduct {
    ok:           boolean;
    detailsInput: DetailsInputs;
}

export interface DetailsInputs {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         ProviderProduct[];
}

export interface ProviderProduct {
    id:              number;
    quantity:        string;
    cost:            string;
    total:           string;
    expiration_date: null;
    profit_margin:   null;
    id_input:        number;
    id_product:      number;
    input:           Input;
}

export interface Input {
    cod:          string;
    date_voucher: Date;
    status:       string;
    provider:     Provider;
}

export interface Provider {
    full_names: string;
    status:     boolean;
}
