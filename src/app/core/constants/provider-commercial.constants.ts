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
  { label: 'Contacto directo', value: 'DIRECT_CONTACT' },
  { label: 'Puerta', value: 'DOOR' },
  { label: 'Buscado por Recumet', value: 'SEARCHED_BY_RECUMET' },
  { label: 'Ruteo / Visita', value: 'ROUTING_VISIT' },
  { label: 'Referido', value: 'REFERRAL' },
  { label: 'Redes Sociales', value: 'SOCIAL_MEDIA' },
  { label: 'WhatsApp / Llamada', value: 'WHATSAPP_CALL' },
  { label: 'SICOES / Licitación', value: 'SICOES_TENDER' },
  { label: 'Invitación de Empresa', value: 'COMPANY_INVITATION' },
  { label: 'Histórico', value: 'HISTORICAL' },
  { label: 'Otro', value: 'OTHER' },
];
export const PROVIDER_RELATIONSHIP_STATUSES: ProviderCatalogOption<ProviderRelationshipStatus>[] = [
  { label: 'Nuevo', value: 'NEW' },
  { label: 'En seguimiento', value: 'FOLLOW_UP' },
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Inactivo', value: 'INACTIVE' },
  { label: 'Por recuperar', value: 'TO_RECOVER' },
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
