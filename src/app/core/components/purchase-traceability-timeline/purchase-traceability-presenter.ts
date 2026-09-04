export type TraceTone = 'success' | 'warning' | 'danger';
const events: Record<string, string> = {
  PURCHASE_CREATED: 'Compra registrada', PURCHASE_UPDATED: 'Compra editada', PURCHASE_VOIDED: 'Compra anulada',
  DETAIL_ADDED: 'Material agregado', DETAIL_UPDATED: 'Material editado', DETAIL_REMOVED: 'Material retirado',
  PRICE_CHANGED: 'Precio modificado', ACCOUNT_PAYABLE_CREATED: 'Cuenta por pagar registrada',
  ACCOUNT_PAYABLE_UPDATED: 'Cuenta por pagar editada', ACCOUNT_PAYABLE_VOIDED: 'Cuenta por pagar anulada',
  PAYMENT_CREATED: 'Abono registrado', PAYMENT_UPDATED: 'Abono editado', PAYMENT_VOIDED: 'Abono anulado',
  PURCHASE_DELETED: 'Compra eliminada', HISTORICAL_EVENT: 'Antecedente histórico', LEGACY_HISTORY: 'Antecedente histórico',
};
const fields: Record<string, string> = {
  id: 'Identificador', cod: 'Código', date_voucher: 'Fecha de compra', type: 'Condición de compra',
  type_payment: 'Forma de pago', type_registry: 'Tipo de comprobante', registry_number: 'Número de comprobante',
  account_input: 'Cuenta de ingreso', comments: 'Observaciones', sumas: 'Subtotal', discount: 'Descuento', total: 'Total',
  is_paid: 'Con factura', id_scales: 'Balanza (identificador)', id_storage: 'Almacén (identificador)',
  id_provider: 'Proveedor (identificador)', id_bank: 'Banco (identificador)', id_sucursal: 'Sucursal (identificador)',
  referral_sources: 'Cómo nos conoció', old_customer: 'Cliente antiguo', with_pickup: 'Con recojo',
  number_transaction: 'Número de transacción', status: 'Estado', id_product: 'Producto (identificador)',
  quantity: 'Cantidad', cost: 'Precio unitario', expiration_date: 'Fecha de vencimiento', profit_margin: 'Margen de ganancia',
  id_input: 'Compra (identificador)', description: 'Descripción', date_credit: 'Fecha del crédito',
  monto_abonado: 'Importe abonado', monto_restante: 'Saldo pendiente', status_account: 'Estado de la cuenta',
  id_account_payable: 'Cuenta por pagar (identificador)', date_abono: 'Fecha del abono', monto_abono: 'Importe del abono',
  total_abonado: 'Total abonado', restante_credito: 'Saldo del crédito', account_output: 'Cuenta de salida',
  from_pay_multiple: 'Pago múltiple', account_origin: 'Cuenta de origen', id_bank_origin: 'Banco de origen (identificador)',
  details: 'Materiales', full_names: 'Nombre completo', name: 'Nombre', role: 'Rol',
};
const values: Record<string, string> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', VOIDED: 'Anulado', CANCELLED: 'Anulado', DELETED: 'Eliminado',
  PENDING: 'Pendiente', PAID: 'Pagado', PARTIAL: 'Parcial', CREDIT: 'A crédito', CASH: 'Al contado',
  TRUE: 'Sí', FALSE: 'No', ADMINISTRADOR: 'Administrador', ENCARGADO: 'Encargado', OPERADOR: 'Operador',
  COMPLETED: 'Completado', OPEN: 'Pendiente', CLOSED: 'Cerrado', TRANSFER: 'Transferencia', CHECK: 'Cheque',
};
export const eventLabel = (type: string): string => events[type] || 'Evento de compra';
export const fieldLabel = (field: string): string => fields[field] || 'Dato adicional';
export const eventTone = (type: string): TraceTone => /VOIDED|REMOVED|DELETED|CANCELLED/.test(type) ? 'danger'
  : /UPDATED|CHANGED/.test(type) ? 'warning' : 'success';
export function displayValue(value: unknown, field = ''): string {
  if (value === null || value === undefined || value === '') return 'Sin dato registrado';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (Array.isArray(value)) return value.map(item => displayValue(item)).join(' · ') || 'Sin registros';
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${fieldLabel(key)}: ${displayValue(item, key)}`).join(' · ');
  if (/^(date_|expiration_date)/.test(field)) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }
  if (['quantity', 'cost', 'total', 'sumas', 'discount', 'profit_margin', 'monto_abonado', 'monto_restante', 'monto_abono', 'total_abonado', 'restante_credito'].includes(field)
    && Number.isFinite(Number(value))) return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 4 }).format(Number(value));
  return values[String(value).toUpperCase()] || String(value);
}
export function eventRows(event: any): { field: string; label: string; before: string; after: string; changed: boolean }[] {
  const before = event.before_data || {};
  const after = event.after_data || {};
  const changes = new Map<string, any>((event.changed_fields || []).map((change: any) => [change.field, change]));
  const editing = eventTone(event.event_type || '') === 'warning';
  const relevant = editing
    ? Object.keys(fields).filter(field => !field.startsWith('id') && !['details', 'cod', 'name', 'full_names', 'role'].includes(field))
    : ['quantity', 'cost', 'sumas', 'discount', 'total', 'monto_abono', 'monto_abonado', 'monto_restante', 'restante_credito'];
  const equivalent = (a: unknown, b: unknown) => {
    if (a === b || (a == null && b == null)) return true;
    if (a !== null && a !== undefined && a !== '' && b !== null && b !== undefined && b !== ''
      && Number.isFinite(Number(a)) && Number.isFinite(Number(b))) return Number(a) === Number(b);
    return false;
  };
  return [...new Set([...Object.keys(before), ...Object.keys(after), ...changes.keys()])].filter(field => {
    if (!relevant.includes(field)) return false;
    const change = changes.get(field);
    const oldValue = change ? change.before : before[field];
    const newValue = change ? change.after : after[field];
    if (editing) return !equivalent(oldValue, newValue);
    return (oldValue != null || newValue != null) && !(field === 'discount' && Number(newValue ?? oldValue) === 0);
  }).map(field => {
    const change = changes.get(field);
    return { field, label: fieldLabel(field), before: displayValue(change ? change.before : before[field], field),
      after: displayValue(change ? change.after : after[field], field), changed: editing };
  });
}
export interface TraceGroup { key: string; actor: string; role: string; date: string; tone: TraceTone; label: string; events: any[]; }
export function groupEvents(items: any[]): TraceGroup[] {
  const groups = new Map<string, TraceGroup>();
  items.forEach((event, index) => {
    // A shared user or date alone is not evidence of a shared operation.
    const key = `${event.correlation_id || `event-${event.id ?? index}`}:${event.id_actor_user ?? event.actor?.id ?? 'unknown'}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, actor: event.actor?.full_names || 'Usuario no disponible', role: displayValue(event.actor?.role),
        date: event.createdAt, tone: 'success', label: 'Registro', events: [] };
      groups.set(key, group);
    }
    const tone = eventTone(event.event_type || '');
    if (tone === 'danger' || (tone === 'warning' && group.tone !== 'danger')) group.tone = tone;
    group.label = group.tone === 'danger' ? 'Anulación o retiro' : group.tone === 'warning' ? 'Edición' : 'Registro';
    group.events.push({ ...event, label: eventLabel(event.event_type), tone, rows: eventRows(event) });
  });
  return [...groups.values()].map(group => {
    const purchaseCreated = group.events.find(event => event.event_type === 'PURCHASE_CREATED');
    if (purchaseCreated) {
      // Item events already contain the original quantities and prices: do not
      // repeat the purchase snapshot or its automatically generated account.
      const addedProducts = new Set(group.events.filter(event => event.event_type === 'DETAIL_ADDED')
        .map(event => String(event.after_data?.id_product)));
      purchaseCreated.materials = (purchaseCreated.after_data?.details || []).filter((detail: any) => !addedProducts.has(String(detail.id_product)))
        .map((detail: any) => ({ name: detail.product?.name || 'Material registrado',
          quantity: displayValue(detail.quantity, 'quantity'), cost: displayValue(detail.cost, 'cost'), total: displayValue(detail.total, 'total') }));
      group.events = group.events.filter(event => event.event_type !== 'ACCOUNT_PAYABLE_CREATED');
    }
    return group;
  });
}
