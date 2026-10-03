import { Options } from "src/app/core/components/interfaces/OptionsTable.interface";
import { Sector } from "./sector.interface";

export interface GetAllProviders {
    ok: boolean;
    providers: Providers;
}

export interface Providers {
    previousPage: number | null;
    currentPage: number;
    nextPage: number | null;
    total: number;
    per_page: number;
    from: number;
    to: number;
    data: Provider[];
}

export interface Provider {
    id: number;
    full_names: string;
    number_document: string;
    cellphone: number;
    direction: string;
    mayorista: boolean;
    name_contact: string;
    cellphone_contact: number;
    id_category: number;
    id_sucursal: null;
    status: boolean;
    createdAt: string;
    updatedAt: string;
    category?: Category;
    sector?: Sector;
    companyContacts: string,
    workAreaOrPositionOrUnit: string,
    frequency: string,
    type: Type | null;
    date_last_input: string,
    total_inputs: number,
    total_products: number,
    saldo_cuentas_por_pagar: number,
    estado_registro?: 'PENDIENTE' | 'VALIDADO';
    commercial_name?: string;
    entity_type?: string;
    origin_channel?: string;
    relationship_status?: string;
    service_mode?: string;
    general_observations?: string;
    commercial_observations?: string;
    negotiation_condition?: string;
    requires_certificate?: boolean;
    requires_traceability_report?: boolean;
    department?: string;
    zone?: string;
    latitude?: number;
    longitude?: number;
    geolocation_text?: string;
    google_maps_url?: string;
    frequency_mode?: string;
    id_commercial_user?: number;
    company?: { id: number; has_branches?: boolean; operatingProviders?: Provider[] };
    branches?: Array<{ id: number; name?: string; department?: string; province?: string; city?: string; zone?: string; address?: string; latitude?: number; longitude?: number; geolocation_text?: string; google_maps_url?: string; is_main?: boolean }>;
    contacts?: Array<{ id: number; full_name?: string; phone?: string; email?: string; position?: string; position_area?: string; cellphone?: string | number; is_main_contact?: boolean }>;
    bankAccounts?: Array<{ id: number; account_holder?: string; account_number?: string; account_type?: string; currency?: string; is_main?: boolean; bank?: { name: string } }>;
    materials?: Array<{ id: number; product?: { name: string; cod?: string }; category?: { name: string } }>;
    options?: Options[];
}

interface Type {
    id: number,
    name: string,
    code: string,
    status: boolean,
    createdAt: string,
    updatedAt: string
}
interface Category {
    id: number;
    name: string;
    description: string;
    status: boolean;
    createdAt: string;
    updatedAt: string;
}


export interface GetAllTypesProvider {
    ok: boolean;
    typesProvider: TypesProvider[];
}

export interface TypesProvider {
    id: number;
    name: string;
    code: string;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
}
