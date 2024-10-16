import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";


// Generated by https://quicktype.io

export interface GetAllUsers {
    ok:    boolean;
    users: Users;
}

export interface Users {
    previousPage: null | number;
    currentPage:  number;
    nextPage:     null | number;
    total:        number;
    per_page:     number;
    from:         number;
    to:           number;
    data:         User[];
}

export interface User {
    id:                number;
    full_names:        string;
    number_document:   string;
    cellphone:         number;
    sex:               string;
    photo:             null | string;
    position:          string;
    email:             string;
    role:              string;
    status:            boolean;
    updatedAt:         string;
    options?:          Options[];
    assign_permission: AssignPermission[];
    assign_shift:      AssignShift[];
    assign_sucursales: AssignSucursales[];
}

export interface AssignPermission {
    id:      number;
    module:  string;
    view:  boolean;
    create:  boolean;
    update:  boolean;
    delete:  boolean;
    reports: boolean;
    status: boolean;
}

export interface AssignShift {
    id:         number;
    day:        string;
    hour_start: string;
    hour_end:   string;
    status: boolean;
}

export interface AssignSucursales {
    id:          number;
    id_sucursal: number;
    status: boolean;
}

export interface FormAssignSucursales {
    id_user: number;
    id_sucursal: number;
    status: boolean
}

export interface FormAssignShifts {
    id_user: number;
    number_day: number;
    day: string;
    hour_start: string;
    hour_end: string;
    status: boolean
}
