import {
  ProviderAccountType,
  ProviderCurrency,
  ProviderEntityType,
  ProviderFrequency,
  ProviderNegotiationCondition,
  ProviderOriginChannel,
  ProviderRelationshipStatus,
  ProviderServiceMode,
  ProviderOperationalType,
} from '../../pages/inputs/interfaces/provider-commercial-profile.interface';

export interface ProviderCatalogOption<T extends string> { label: string; value: T; }

export const PROVIDER_ENTITY_TYPES: ProviderCatalogOption<ProviderEntityType>[] = [
  { label: 'Privada', value: 'PRIVATE' }, { label: 'Pública', value: 'PUBLIC' },
  { label: 'ONG / Fundación', value: 'NGO_FOUNDATION' }, { label: 'Otra', value: 'OTHER' },
];
export const PROVIDER_OPERATIONAL_TYPES: ProviderCatalogOption<ProviderOperationalType>[] = [
  { label: 'Materia prima', value: 'RAW_MATERIAL' }, { label: 'Servicios', value: 'SERVICES' },
  { label: 'Insumos', value: 'SUPPLIES' }, { label: 'Equipos / activos', value: 'EQUIPMENT_ASSETS' },
  { label: 'Comercial', value: 'COMMERCIAL' }, { label: 'Otro', value: 'OTHER' },
];
export const PROVIDER_FREQUENCIES: ProviderCatalogOption<ProviderFrequency>[] = [
  { label: 'Semanal', value: 'WEEKLY' }, { label: 'Quincenal', value: 'BIWEEKLY' },
  { label: 'Mensual', value: 'MONTHLY' }, { label: 'Trimestral', value: 'QUARTERLY' },
  { label: 'Anual', value: 'ANNUAL' },
  { label: 'Eventual', value: 'EVENTUAL' }, { label: 'Sin determinar', value: 'UNDETERMINED' },
];
export const PROVIDER_SERVICE_MODES: ProviderCatalogOption<ProviderServiceMode>[] = [
  { label: 'Entrega en Recumet', value: 'DELIVERY_TO_RECUMET' },
  { label: 'Recojo por Recumet', value: 'PICKUP_BY_RECUMET' }, { label: 'Ambos', value: 'BOTH' },
];
export const PROVIDER_ORIGIN_CHANNELS: ProviderCatalogOption<ProviderOriginChannel>[] = [
  { label: 'Prospección', value: 'PROSPECTION' }, { label: 'Referido', value: 'REFERRAL' },
  { label: 'SICOES', value: 'SICOES' }, { label: 'Redes', value: 'SOCIAL_MEDIA' },
  { label: 'Puerta', value: 'DOOR' }, { label: 'Contacto directo', value: 'DIRECT_CONTACT' },
  { label: 'Otro', value: 'OTHER' },
];
export const PROVIDER_RELATIONSHIP_STATUSES: ProviderCatalogOption<ProviderRelationshipStatus>[] = [
  { label: 'Prospecto', value: 'PROSPECT' }, { label: 'En gestión', value: 'IN_PROGRESS' },
  { label: 'Proveedor activo', value: 'ACTIVE_PROVIDER' }, { label: 'Sin movimiento', value: 'DORMANT' },
  { label: 'Perdido', value: 'LOST' },
];
export const PROVIDER_NEGOTIATION_CONDITIONS: ProviderCatalogOption<ProviderNegotiationCondition>[] = [
  { label: 'Directa', value: 'DIRECT' }, { label: 'Cotización', value: 'QUOTATION' },
  { label: 'Licitación', value: 'TENDER' }, { label: 'Convenio', value: 'AGREEMENT' },
  { label: 'Contrato', value: 'CONTRACT' }, { label: 'Otra', value: 'OTHER' },
];
export const PROVIDER_ACCOUNT_TYPES: ProviderCatalogOption<ProviderAccountType>[] = [
  { label: 'Caja de ahorro', value: 'CAJA_AHORRO' },
  { label: 'Cuenta corriente', value: 'CUENTA_CORRIENTE' }, { label: 'Otra', value: 'OTRA' },
];
export const PROVIDER_CURRENCIES: ProviderCatalogOption<ProviderCurrency>[] = [
  { label: 'BOB', value: 'BOB' }, { label: 'USD', value: 'USD' },
];
