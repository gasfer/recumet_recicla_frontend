export const USER_ROLE_OPTIONS = [
  { name: 'ADMINISTRADOR/A', code: 'ADMINISTRADOR' },
  { name: 'ENCARGADO/A', code: 'ENCARGADO' },
  { name: 'OPERADOR/A', code: 'OPERADOR' },
  { name: 'EJECUTIVO COMERCIAL', code: 'COMERCIAL' },
  { name: 'OPERADOR DE BALANZA', code: 'OPERADOR_BALANZA' },
  { name: 'RESPONSABLE DE LIQUIDACIÓN Y CAJA', code: 'LIQUIDACION_CAJA' },
];

const ROLE_PRESENTATION: Record<string, { label: string; icon: string; classes: string }> = {
  ADMINISTRADOR: { label: 'Administrador/a', icon: 'fa-solid fa-user-shield', classes: 'erp-badge-neutral' },
  ENCARGADO: { label: 'Encargado/a', icon: 'fa-solid fa-user-tie', classes: 'erp-badge-info' },
  OPERADOR: { label: 'Operador/a', icon: 'fa-solid fa-user-gear', classes: 'erp-badge-neutral' },
  COMERCIAL: { label: 'Ejecutivo comercial', icon: 'fa-solid fa-handshake', classes: 'erp-badge-success' },
  OPERADOR_BALANZA: { label: 'Operador de Balanza', icon: 'fa-solid fa-scale-balanced', classes: 'erp-badge-info' },
  LIQUIDACION_CAJA: { label: 'Responsable de Liquidación y Caja', icon: 'fa-solid fa-cash-register', classes: 'erp-badge-warning' },
};

export const userRolePresentation = (role?: string) => ROLE_PRESENTATION[role || '']
  || { label: role || 'Sin rol', icon: 'fa-solid fa-user', classes: 'erp-badge-neutral' };
