export interface Auth {
    ok:    boolean;
    user:  User;
    token: string;
    company: Company;
}

export interface User {
    id:                number;
    full_names:        string;
    number_document:   string;
    cellphone:         number;
    sex:               string;
    photo:             string;
    position:          string;
    email:             string;
    role:              string;
    status:            boolean;
    assign_permission: AssignPermission[];
    assign_shift:      AssignShift[];
    assign_sucursales: AssignSucursales[];
}

interface Company {
    decimals: number;
}

export interface AssignPermission {
    id:      number;
    module:  string;
    view:    boolean;
    create:  boolean;
    update:  boolean;
    delete:  boolean;
    reports: boolean;
}

export interface AssignShift {
    id:         number;
    day:        string;
    hour_start: string;
    hour_end:   string;
}

export interface AssignSucursales {
    id:          number;
    id_sucursal: number;
}
export interface FormAuth {
    email:    string;
    password: string;
}