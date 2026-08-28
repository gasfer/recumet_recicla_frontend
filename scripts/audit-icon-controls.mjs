import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appRoot = join(projectRoot, 'src', 'app');
const reportPath = join(projectRoot, 'docs', 'quality', 'icon-control-audit.json');

if (process.argv.includes('--fix')) {
  throw new Error('Automatic icon-label fixes are disabled. Review the audit report and update each template intentionally.');
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extname(entry.name) === '.html' ? [fullPath] : [];
  });
}

function maskHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?(?:-->|$)/g, (comment) => comment.replace(/[^\r\n]/g, ' '));
}

function findOpeningTags(source, tagName) {
  const matches = [];
  const startPattern = new RegExp(`<${tagName}\\b`, 'gi');
  let startMatch;

  while ((startMatch = startPattern.exec(source)) !== null) {
    let quote = null;
    let cursor = startMatch.index + startMatch[0].length;

    for (; cursor < source.length; cursor += 1) {
      const character = source[cursor];
      if (quote) {
        if (character === quote) quote = null;
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
        continue;
      }
      if (character === '>') break;
    }

    if (cursor >= source.length) break;
    matches.push({
      start: startMatch.index,
      end: cursor + 1,
      openingTag: source.slice(startMatch.index, cursor + 1),
    });
    startPattern.lastIndex = cursor + 1;
  }

  return matches;
}

function closingTag(source, tagName, fromIndex) {
  const pattern = new RegExp(`</${tagName}\\s*>`, 'gi');
  pattern.lastIndex = fromIndex;
  const match = pattern.exec(source);
  return match ? { start: match.index, end: pattern.lastIndex } : null;
}

function attributeValues(openingTag, names) {
  const escapedNames = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(?:^|\\s)(?:${escapedNames.join('|')})\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'gi');
  return [...openingTag.matchAll(pattern)].map((match) => match[2].trim()).filter(Boolean);
}

function isGenericName(value) {
  return /(?:acci[oó]n)\s+disponible/i.test(value);
}

function visibleText(body) {
  return body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMeaningfulVisibleText(body) {
  const text = visibleText(body);
  return /\p{L}/u.test(text) || /\{\{[\s\S]*?\}\}/.test(text);
}

function hasNamedImage(body) {
  return /<img\b[^>]*\balt\s*=\s*(["'])\s*[^\s"'][\s\S]*?\1[^>]*>/i.test(body);
}

function nameState(openingTag, body) {
  const ariaValues = attributeValues(openingTag, [
    'aria-label',
    'ariaLabel',
    '[ariaLabel]',
    '[attr.aria-label]',
    'aria-labelledby',
    '[aria-labelledby]',
    '[attr.aria-labelledby]',
  ]);
  const labelValues = attributeValues(openingTag, ['label', '[label]']);
  const titleValues = attributeValues(openingTag, ['title', '[title]', '[attr.title]']);
  const values = [...ariaValues, ...labelValues, ...titleValues];
  const text = visibleText(body);
  const generic = values.some(isGenericName) || isGenericName(text);
  const named = values.length > 0 || hasMeaningfulVisibleText(body) || hasNamedImage(body);
  return { generic, named };
}

function hasIcon(openingTag, body) {
  return /(?:\[\s*icon\s*\]|\bicon)\s*=/i.test(openingTag)
    || /<(?:i|svg)\b/i.test(body)
    || /<(?:span|img)\b[^>]*\bclass\s*=\s*(["'])[^"']*\b(?:fa\w*|pi|bx|mdi|icon)[-\s][^"']*\1/i.test(body);
}

function tooltipValue(openingTag) {
  return attributeValues(openingTag, ['pTooltip', '[pTooltip]'])[0] ?? '';
}

function suggestedName(source) {
  const value = source.toLowerCase();
  const mappings = [
    [/clear|broom/, 'Limpiar'], [/save|floppy/, 'Guardar'], [/cancel/, 'Cancelar'],
    [/trash|delete/, 'Eliminar'], [/edit|pencil|pen/, 'Editar'], [/eye|view/, 'Ver detalles'],
    [/print|pdf/, 'Imprimir'], [/plus|add/, 'Añadir'], [/search|magnify/, 'Buscar'],
    [/close|times|xmark/, 'Cerrar'], [/arrow-left|chevron-left/, 'Anterior'],
    [/arrow-right|chevron-right/, 'Siguiente'], [/cart/, 'Seleccionar producto'],
    [/bell/, 'Abrir notificaciones'], [/cog|gear/, 'Configuración'],
    [/bars|menu/, 'Abrir menú de navegación'], [/download/, 'Descargar'],
    [/upload/, 'Subir archivo'], [/image|camera/, 'Ver imagen'], [/check/, 'Confirmar'],
    [/history/, 'Ver historial'], [/fullscreen|expand/, 'Pantalla completa'],
  ];
  return mappings.find(([pattern]) => pattern.test(value))?.[1] ?? 'Describir la acción';
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function compactControl(source) {
  return source.replace(/\s+/g, ' ').trim().slice(0, 240);
}

function pushControl(unresolved, { file, original, start, controlType, openingTag, body = '', reasons }) {
  const tooltip = tooltipValue(openingTag);
  unresolved.push({
    file: relative(projectRoot, file).replaceAll('\\', '/'),
    line: lineNumber(original, start),
    controlType,
    reasons,
    control: compactControl(`${openingTag}${body}`),
    suggestedName: tooltip && !isGenericName(tooltip) ? tooltip : suggestedName(`${openingTag}${body}`),
  });
}

function auditButton(unresolved, context) {
  const { openingTag, body } = context;
  if (!hasIcon(openingTag, body)) return;
  const state = nameState(openingTag, body);
  const reasons = [];
  if (!state.named) reasons.push('missing-accessible-name');
  if (state.generic) reasons.push('generic-accessible-name');
  if (reasons.length) pushControl(unresolved, { ...context, reasons });
}

function auditInteractiveIcon(unresolved, context) {
  const { openingTag } = context;
  if (!/\(click\)\s*=/i.test(openingTag)) return;

  const state = nameState(openingTag, '');
  const hasButtonRole = /\brole\s*=\s*(["'])button\1/i.test(openingTag);
  const hasTabindex = attributeValues(openingTag, ['tabindex', '[tabindex]', '[attr.tabindex]']).length > 0;
  const hasEnter = /\(key(?:down|up|press)\.enter\)\s*=/i.test(openingTag);
  const hasSpace = /\(key(?:down|up|press)\.(?:space|spacebar)\)\s*=/i.test(openingTag);
  const reasons = [];
  if (!hasButtonRole) reasons.push('missing-button-role');
  if (!hasTabindex) reasons.push('missing-keyboard-focus');
  if (!state.named) reasons.push('missing-accessible-name');
  if (state.generic) reasons.push('generic-accessible-name');
  if (!hasEnter) reasons.push('missing-enter-handler');
  if (!hasSpace) reasons.push('missing-space-handler');
  if (reasons.length) pushControl(unresolved, { ...context, reasons });
}

const unresolved = [];

for (const file of walk(appRoot)) {
  const original = readFileSync(file, 'utf8');
  const source = maskHtmlComments(original);

  for (const match of findOpeningTags(source, 'button')) {
    const close = closingTag(source, 'button', match.end);
    const body = close ? source.slice(match.end, close.start) : '';
    auditButton(unresolved, { file, original, ...match, body, controlType: 'button' });
  }

  for (const match of findOpeningTags(source, 'p-button')) {
    const selfClosing = /\/\s*>$/.test(match.openingTag);
    const close = selfClosing ? null : closingTag(source, 'p-button', match.end);
    const body = close ? source.slice(match.end, close.start) : '';
    auditButton(unresolved, { file, original, ...match, body, controlType: 'p-button' });
  }

  for (const match of findOpeningTags(source, 'i')) {
    auditInteractiveIcon(unresolved, { file, original, ...match, controlType: 'interactive-icon' });
  }
}

const report = {
  unresolved: unresolved.length,
  controls: unresolved,
};
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Icon control audit: ${unresolved.length} unresolved controls.`);
if (unresolved.length) process.exitCode = 1;
