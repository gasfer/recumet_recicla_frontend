export const USER_ROLE_OPTIONS = [
  { name: 'ADMINISTRADOR/A', code: 'ADMINISTRADOR' },
  { name: 'ENCARGADO/A', code: 'ENCARGADO' },
  { name: 'OPERADOR/A', code: 'OPERADOR' },
  { name: 'EJECUTIVO COMERCIAL', code: 'COMERCIAL' },
  { name: 'OPERADOR DE BALANZA', code: 'OPERADOR_BALANZA' },
  { name: 'RESPONSABLE DE LIQUIDACIÓN Y CAJA', code: 'LIQUIDACION_CAJA' },
];

const ROLE_PRESENTATION: Record<string, { label: string; icon: string; classes: string }> = {
  ADMINISTRADOR: { label: 'Administrador/a', icon: 'fa-solid fa-user-shield', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
  ENCARGADO: { label: 'Encargado/a', icon: 'fa-solid fa-user-tie', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  OPERADOR: { label: 'Operador/a', icon: 'fa-solid fa-user-gear', classes: 'bg-violet-50 text-violet-700 border-violet-200' },
  COMERCIAL: { label: 'Ejecutivo comercial', icon: 'fa-solid fa-handshake', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OPERADOR_BALANZA: { label: 'Operador de Balanza', icon: 'fa-solid fa-scale-balanced', classes: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  LIQUIDACION_CAJA: { label: 'Responsable de Liquidación y Caja', icon: 'fa-solid fa-cash-register', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const userRolePresentation = (role?: string) => ROLE_PRESENTATION[role || '']
  || { label: role || 'Sin rol', icon: 'fa-solid fa-user', classes: 'bg-slate-100 text-slate-700 border-slate-200' };
