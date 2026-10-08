export type ProviderManagementQuery = Record<string, string | number | boolean | null | Array<number | string>>;
export interface ManagementOption { id?: number; name: string; code?: string; value?: string; id_sucursal?: number; }
export interface ProviderManagementCatalogs {
  branches: ManagementOption[]; storages: ManagementOption[]; categories: ManagementOption[];
  products: ManagementOption[]; types: ManagementOption[]; users: Array<{ id: number; full_names: string }>;
  departments: ManagementOption[]; cities: ManagementOption[];
}
