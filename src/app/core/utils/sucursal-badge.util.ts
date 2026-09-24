export interface SucursalTheme {
  bg: string;
  color: string;
  border: string;
}

const FALLBACK_PALETTES: SucursalTheme[] = [
  { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' }, // Sky
  { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' }, // Mint
  { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' }, // Lavender
  { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' }, // Peach
  { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' }, // Rose
  { bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' }, // Teal
  { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' }, // Indigo
  { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' }, // Amber
];

const KNOWN_SUCURSAL_MAP: Record<string, SucursalTheme> = {
  'casa matriz': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  'sucursal oruro': { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  'sucursal vip': { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  'sucursal cgt': { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
  'sucursal prodmetal cgs': { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' },
  'sucursal santa cruz sur': { bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' },
  'sucursal santa cruz norte': { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
  'sucursal cbba-republica': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  'cbba republica': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
};

function normalizeSucursalKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSucursalTheme(nameOrId?: string | number | null): SucursalTheme {
  if (!nameOrId && nameOrId !== 0) {
    return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
  }

  if (typeof nameOrId === 'number') {
    return FALLBACK_PALETTES[Math.abs(nameOrId) % FALLBACK_PALETTES.length];
  }

  const rawName = String(nameOrId);
  const normalized = normalizeSucursalKey(rawName);

  if (KNOWN_SUCURSAL_MAP[normalized]) {
    return KNOWN_SUCURSAL_MAP[normalized];
  }

  const stripped = normalized.replace(/^sucursal\s+/, '');
  for (const [key, theme] of Object.entries(KNOWN_SUCURSAL_MAP)) {
    if (key.includes(stripped) || stripped.includes(key)) {
      return theme;
    }
  }

  return FALLBACK_PALETTES[hashString(normalized) % FALLBACK_PALETTES.length];
}

export function getSucursalBadgeStyle(nameOrId?: string | number | null): Record<string, string> {
  const theme = getSucursalTheme(nameOrId);
  return {
    'background-color': theme.bg,
    'color': theme.color,
    'border': `1px solid ${theme.border}`,
    'border-radius': '999px',
    'padding': '0.2rem 0.65rem',
    'font-weight': '600',
    'font-size': '0.78rem',
    'display': 'inline-flex',
    'align-items': 'center',
    'gap': '0.35rem',
    'line-height': '1.3'
  };
}
