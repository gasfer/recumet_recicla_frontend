export interface GetAllHistories {
    ok:        boolean;
    histories: Histories;
}

export interface Histories {
    previousPage: null;
    currentPage:  number;
    nextPage:     number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         History[];
}

export interface History {
    description:  string;
    type:         string;
    module:       string;
    action:       string | null;
    createdAt:    string;
    id_reference: number | null;
    user:         User | null;
}


export interface User {
    full_names:      string;
    number_document: string;
    cellphone:       number;
    role:            string;
}
