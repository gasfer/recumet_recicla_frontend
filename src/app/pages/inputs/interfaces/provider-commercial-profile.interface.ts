export type ProviderSiteRole = 'HEADQUARTERS' | 'BRANCH';
export type ProviderEntityType = 'PRIVATE' | 'PUBLIC' | 'NGO_FOUNDATION' | 'OTHER';
export type ProviderFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'EVENTUAL' | 'UNDETERMINED';
export type ProviderServiceMode = 'DELIVERY_TO_RECUMET' | 'PICKUP_BY_RECUMET' | 'BOTH';
export type ProviderOriginChannel = 'PROSPECTION' | 'REFERRAL' | 'SICOES' | 'SOCIAL_MEDIA' | 'DOOR' | 'DIRECT_CONTACT' | 'OTHER';
export type ProviderRelationshipStatus = 'PROSPECT' | 'IN_PROGRESS' | 'ACTIVE_PROVIDER' | 'DORMANT' | 'LOST';
export type ProviderNegotiationCondition = 'DIRECT' | 'QUOTATION' | 'TENDER' | 'AGREEMENT' | 'CONTRACT' | 'OTHER';
export type ProviderAccountType = 'CAJA_AHORRO' | 'CUENTA_CORRIENTE' | 'OTRA';
export type ProviderCurrency = 'BOB' | 'USD';
export type ProviderOperationalType = 'RAW_MATERIAL' | 'SERVICES' | 'SUPPLIES' | 'EQUIPMENT_ASSETS' | 'COMMERCIAL' | 'OTHER';

export interface ProviderLocationProfile {
  id?: number;
  branch_name: string;
  department: string;
  province?: string | null;
  city: string;
  zone?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  geolocation_text?: string | null;
  google_maps_url?: string | null;
  is_main: boolean;
  status: boolean;
}

export interface ProviderContactProfile {
  id?: number;
  full_name: string;
  position_area: string;
  cellphone: string;
  email?: string | null;
  is_main_contact: boolean;
  status: boolean;
}

export interface ProviderMaterialProfile {
  id?: number;
  id_category: number;
  id_product?: number | null;
  frequency?: ProviderFrequency | null;
  service_mode?: ProviderServiceMode | null;
  status: boolean;
  category?: { id: number; name: string };
  product?: { id: number; name: string; cod?: string };
}

export interface ProviderBankAccountProfile {
  id?: number;
  id_bank: number;
  account_holder: string;
  account_number: string;
  account_type: ProviderAccountType;
  currency: ProviderCurrency;
  is_main: boolean;
  status: boolean;
  bank?: { id: number; name: string };
}

export interface ProviderSiteProfile {
  id?: number;
  id_provider_company?: number | null;
  id_sucursal?: number | null;
  site_role: ProviderSiteRole;
  full_names: string;
  number_document: string;
  cellphone?: string | null;
  frequency: ProviderFrequency;
  service_mode: ProviderServiceMode;
  status: boolean;
  location: ProviderLocationProfile;
  contacts: ProviderContactProfile[];
  materials: ProviderMaterialProfile[];
  bankAccounts: ProviderBankAccountProfile[];
}

export interface ProviderCompanyProfile {
  id?: number;
  full_names: string;
  commercial_name?: string | null;
  corporate_phone?: string | null;
  corporate_cellphone?: string | null;
  corporate_email?: string | null;
  website?: string | null;
  number_document: string;
  entity_type: ProviderEntityType;
  id_type_provider: number;
  operational_type: ProviderOperationalType;
  id_commercial_user?: number | null;
  origin_channel: ProviderOriginChannel;
  relationship_status: ProviderRelationshipStatus;
  negotiation_condition?: ProviderNegotiationCondition | null;
  commercial_observations?: string | null;
  requires_certificate: boolean | null;
  requires_traceability_report: boolean | null;
  general_observations?: string | null;
  status: boolean;
  operatingProviders?: ProviderSiteProfile[];
}

export interface ProviderMunicipalityOption {
  department: string;
  province: string;
  name: string;
}

export interface ProviderCompanyPurchaseSummary {
  purchased_kg: number;
  purchased_amount: number;
  paid_amount: number;
  pending_amount: number;
  purchase_count: number;
  active_sites: number;
}

export interface ProviderCommercialProfileResponse {
  ok: boolean;
  company: ProviderCompanyProfile;
}

export interface ProviderCommercialCompaniesResponse {
  ok: boolean;
  companies: ProviderCompanyProfile[];
  ungrouped: ProviderSiteProfile[];
}

export interface ProviderSiteResponse { ok: boolean; site: ProviderSiteProfile; }
export interface ProviderPendingSummary {
  provider_id: number;
  purchases: number;
  pending_accounts: number;
  can_deactivate: boolean;
}
