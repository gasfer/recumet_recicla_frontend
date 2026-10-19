import fs from 'node:fs';
import path from 'node:path';
import { HtmlParser } from '@angular/compiler';

// Convert presentation attributes only; Angular bindings and events are preserved.
const modules = ['inputs', 'Expenses', 'classifieds', 'outputs', 'inventories', 'accounts', 'caja', 'balanza', 'transfers'];
const parser = new HtmlParser();
const apply = process.argv.includes('--apply');
const breakpoints = { sm: 768, md: 768, lg: 1024, xl: 1280, xxl: 1536 };
const spacing = { 0: '0', 1: '1', 2: '2', 3: '4', 4: '6', 5: '12', auto: 'auto' };
const simple = {
  row: 'flex flex-wrap gap-y-3 erp-layout-row',
  'd-flex': 'flex', 'd-inline-flex': 'inline-flex', 'd-block': 'block', 'd-inline-block': 'inline-block', 'd-none': 'hidden',
  'align-items-center': 'items-center', 'align-items-start': 'items-start', 'align-items-end': 'items-end', 'align-items-stretch': 'items-stretch',
  'justify-content-between': 'justify-between', 'justify-content-center': 'justify-center', 'justify-content-end': 'justify-end', 'justify-content-start': 'justify-start',
  'flex-column': 'flex-col', 'flex-row': 'flex-row', 'flex-grow-1': 'grow', 'flex-shrink-0': 'shrink-0',
  'fw-bold': 'font-bold', 'fw-semibold': 'font-semibold', 'fw-medium': 'font-medium', 'fw-normal': 'font-normal',
  'text-uppercase': 'uppercase', 'text-lowercase': 'lowercase', 'text-capitalize': 'capitalize',
  'text-end': 'text-right', 'text-start': 'text-left', 'text-truncate': 'truncate', 'text-nowrap': 'whitespace-nowrap',
  'text-decoration-none': 'no-underline', 'font-monospace': 'font-mono',
  'position-relative': 'relative', 'position-absolute': 'absolute', 'position-fixed': 'fixed', 'position-sticky': 'sticky',
  'rounded-pill': 'rounded-full', 'rounded-circle': 'rounded-full', 'border-bottom': 'border-b', 'border-top': 'border-t',
  'border-start': 'border-l', 'border-end': 'border-r', 'w-100': 'w-full', 'h-100': 'h-full',
  'fs-1': 'text-4xl', 'fs-2': 'text-3xl', 'fs-3': 'text-2xl', 'fs-4': 'text-xl', 'fs-5': 'text-lg', 'fs-6': 'text-base',
  'text-muted': 'text-erp-text-muted', 'text-dark': 'text-erp-text', 'text-black': 'text-erp-text',
  'bg-white': 'bg-erp-surface', 'bg-light': 'bg-erp-bg',
  'text-primary': 'text-erp-success', 'text-success': 'text-erp-success', 'text-danger': 'text-erp-danger', 'text-warning': 'text-erp-warning', 'text-info': 'text-erp-info',
  'btn': 'erp-btn', 'btn-sm': 'erp-btn-sm', 'btn-primary': 'erp-btn-primary', 'btn-success': 'erp-btn-primary',
  'btn-secondary': 'erp-btn-secondary', 'btn-light': 'erp-btn-secondary', 'btn-danger': 'erp-btn-danger',
  'btn-warning': 'erp-btn-warning', 'btn-info': 'erp-btn-info',
  'btn-outline-primary': 'erp-btn-outline-primary', 'btn-outline-success': 'erp-btn-outline-primary',
  'btn-outline-secondary': 'erp-btn-secondary', 'btn-outline-danger': 'erp-btn-outline-danger',
  'btn-outline-warning': 'erp-btn-outline-warning', 'btn-outline-info': 'erp-btn-outline-info', 'btn-outline-light': 'erp-btn-secondary',
};
const icons = {plus:'plus', 'plus-circle':'circle-plus', eye:'eye', pencil:'pen-to-square', ban:'ban', times:'xmark', check:'check', filter:'filter', search:'magnifying-glass', 'file-pdf':'file-pdf', 'file-excel':'file-excel', print:'print', trash:'trash-can', refresh:'rotate', desktop:'desktop', 'info-circle':'circle-info', 'user-plus':'user-plus', phone:'phone', save:'floppy-disk', download:'download', upload:'upload', 'arrow-left':'arrow-left', 'arrow-right':'arrow-right', 'check-circle':'circle-check'};
function convert(token, tokens) {
  if (token === 'grid' && tokens.includes('p-fluid')) return 'erp-form-grid';
  if (token === 'field') return 'erp-field';
  if (token === 'pi' && tokens.some(t => t.startsWith('pi-') && icons[t.slice(3)])) return '';
  if (token.startsWith('pi-') && tokens.includes('pi') && icons[token.slice(3)]) return 'fa-solid fa-' + icons[token.slice(3)];
  if (token === 'row') return `flex flex-wrap erp-layout-row${tokens.some(t => /^g[y]?-[0-5]$/.test(t)) ? '' : ' gap-y-3'}`;
  const solidRole = tokens.find(t => /^bg-(success|primary|warning|danger|info|secondary)$/.test(t));
  const roleFor = t => ({primary:'success', secondary:'neutral'}[t] ?? t);
  if (solidRole && token === 'text-white') return 'text-erp-' + (roleFor(solidRole.slice(3)) === 'neutral' ? 'text-muted' : roleFor(solidRole.slice(3)));
  if (/^bg-(success|primary|warning|danger|info|secondary)$/.test(token)) { const role = roleFor(token.slice(3)); return role === 'neutral' ? 'bg-erp-bg' : 'bg-erp-' + role + '-soft'; }
  if (simple[token]) return simple[token];
  const col = token.match(/^col(?:-(sm|md|lg|xl|xxl))?-(\d+|auto)$/);
  if (col) {
    // Narrow screens always retain readable full-width form fields.
    const prefix = col[1] ? `min-[${breakpoints[col[1]]}px]:` : col[2] === '12' ? '' : 'md:';
    return col[2] === 'auto' ? `${prefix}w-auto px-2 min-w-0` : `${prefix}w-[${Number(col[2]) / 12 * 100}%] px-2 min-w-0${prefix ? ' w-full' : ''}`;
  }
  if (token === 'col') return 'w-full md:flex-1 px-2 min-w-0';
  const direction = token.match(/^([mp])([se])(?:-(sm|md|lg|xl|xxl))?-(0|1|2|3|4|5|auto)$/);
  if (direction) return `${direction[3] ? `min-[${breakpoints[direction[3]]}px]:` : ''}${direction[1]}${direction[2] === 's' ? 'l' : 'r'}-${spacing[direction[4]]}`;
  const display = token.match(/^d-(sm|md|lg|xl|xxl)-(none|flex|block|inline-block)$/);
  if (display) return `min-[${breakpoints[display[1]]}px]:${display[2] === 'none' ? 'hidden' : display[2]}`;
  if (/^g[xy]?-[0-5]$/.test(token)) return token[1] === 'y' ? `gap-y-${spacing[token.at(-1)]}` : token[1] === 'x' ? '' : `gap-y-${spacing[token.at(-1)]}`;
  const color = token.match(/^(bg|text|border)-(slate|emerald|green|blue|sky|amber|rose|red)-(\d+)(\/\d+)?$/);
  if (color) {
    const role = { slate: 'neutral', emerald: 'success', green: 'success', blue: 'info', sky: 'info', amber: 'warning', rose: 'danger', red: 'danger' }[color[2]];
    if (color[1] === 'bg') return `bg-erp-${role === 'neutral' ? Number(color[3]) >= 700 ? 'header' : 'bg' : role + '-soft'}${color[4] ?? ''}`;
    if (color[1] === 'border') return 'border-erp-border';
    return `text-erp-${role === 'neutral' ? Number(color[3]) >= 600 ? 'text' : 'text-muted' : role}`;
  }
  return token;
}
function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walkFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const results = [];
for (const module of modules) {
  let changed = 0, attributes = 0;
  for (const file of walkFiles(`src/app/pages/${module}`).filter(file => file.endsWith('.html'))) {
    const source = fs.readFileSync(file, 'utf8');
    const parsed = parser.parse(source, file);
    if (parsed.errors.length) throw new Error(`${file}: HTML parsing errors: ${parsed.errors.join('\n')}`);
    const edits = [];
    function visit(node) {
      for (const attr of node.attrs ?? []) {
        if (!['class', 'styleClass', 'icon'].includes(attr.name) || !attr.valueSpan || attr.value.includes('{{')) continue;
        const tokens = attr.value.split(/\s+/).filter(Boolean);
        const value = [...new Set(tokens.flatMap(token => convert(token, tokens).split(/\s+/)).filter(Boolean))].join(' ');
        if (value !== attr.value.trim()) edits.push({ start: attr.valueSpan.start.offset, end: attr.valueSpan.end.offset, value });
      }
      for (const child of node.children ?? []) visit(child);
    }
    parsed.rootNodes.forEach(visit);
    if (!edits.length) continue;
    let output = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
    if (apply) fs.writeFileSync(file, output);
    changed++; attributes += edits.length;
  }
  results.push({ module, changedTemplates: changed, changedAttributes: attributes });
}
console.log(JSON.stringify({ apply, results }, null, 2));
