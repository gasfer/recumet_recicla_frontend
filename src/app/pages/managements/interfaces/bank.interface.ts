export interface GetAllBanks {
    ok:    boolean;
    banks: Banks;
}

export interface Banks {
    previousPage: null;
    currentPage:  number;
    nextPage:     null;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         Bank[];
}

export interface Bank {
    id:        number;
    name:      string;
    status:    boolean;
    createdAt: string;
    updatedAt: string;
}
