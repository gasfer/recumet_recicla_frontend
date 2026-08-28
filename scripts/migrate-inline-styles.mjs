import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appRoot = join(projectRoot, 'src', 'app');
const generatedScss = join(projectRoot, 'src', 'assets', 'scss', 'custom', '_responsive-utilities.generated.scss');

const knownUtilities = new Map([
  ['display:none', 'd-none'],
  ['display:flex', 'd-flex'],
  ['display:inline', 'd-inline'],
  ['display:inline-block', 'd-inline-block'],
  ['position:relative', 'position-relative'],
  ['position:absolute', 'position-absolute'],
  ['text-transform:uppercase', 'text-uppercase'],
  ['text-align:left', 'text-start'],
  ['text-align:right', 'text-end'],
  ['text-align:center', 'text-center'],
  ['align-items:center', 'align-items-center'],
  ['justify-content:center', 'justify-content-center'],
  ['justify-content:flex-end', 'justify-content-end'],
  ['font-weight:bold', 'fw-bold'],
  ['font-weight:700', 'fw-bold'],
  ['background-color:var(--bg-primary)', 'background-primary'],
]);

const generatedRules = new Map();

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extname(entry.name) === '.html' ? [fullPath] : [];
  });
}

function normalizeProperty(property) {
  return property.trim().replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).toLowerCase();
}

function normalizeValue(value) {
  return value.trim().replace(/\s*!important\s*$/i, ' !important');
}

function parseDeclarations(value) {
  return value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) throw new Error(`Invalid inline declaration: ${declaration}`);
      return [normalizeProperty(declaration.slice(0, separator)), normalizeValue(declaration.slice(separator + 1))];
    });
}

function generatedUtility(property, value) {
  const key = `${property}:${value}`;
  const readable = `${property}-${value}`
    .toLowerCase()
    .replace(/var\(--([^)]+)\)/g, '$1')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 44);
  const hash = createHash('sha1').update(key).digest('hex').slice(0, 7);
  const className = `app-u-${readable}-${hash}`;
  generatedRules.set(className, { property, value });
  return className;
}

function classesFor(declarations, forceGenerated = false) {
  return declarations.map(([property, value]) => {
    const normalizedKey = `${property}:${value.replace(/\s*!important$/, '').trim()}`;
    return !forceGenerated && knownUtilities.has(normalizedKey)
      ? knownUtilities.get(normalizedKey)
      : generatedUtility(property, value);
  });
}

function addClasses(tag, classes) {
  const unique = [...new Set(classes)].filter(Boolean);
  if (!unique.length) return tag;
  const classMatch = tag.match(/\sclass\s*=\s*(['"])([\s\S]*?)\1/i);
  if (classMatch) {
    const merged = [...new Set([...classMatch[2].split(/\s+/).filter(Boolean), ...unique])].join(' ');
    return tag.replace(classMatch[0], ` class=${classMatch[1]}${merged}${classMatch[1]}`);
  }
  return tag.replace(/\s*\/?>$/, (ending) => ` class="${unique.join(' ')}"${ending.trimStart()}`);
}

function parseStaticStyleObject(expression) {
  const trimmed = expression.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  const body = trimmed.slice(1, -1);
  const declarations = [];
  const pattern = /['"]?([a-zA-Z][\w-]*)['"]?\s*:\s*(['"])(.*?)\2\s*(?:,|$)/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(body))) {
    if (body.slice(cursor, match.index).trim()) return null;
    declarations.push([normalizeProperty(match[1]), normalizeValue(match[3])]);
    cursor = pattern.lastIndex;
  }
  if (!declarations.length || body.slice(cursor).trim()) return null;
  return declarations;
}

let literalAttributes = 0;
let staticBindings = 0;

for (const file of walk(appRoot)) {
  const original = readFileSync(file, 'utf8');
  const updated = original.replace(/<[a-zA-Z][\s\S]*?>/g, (openingTag) => {
    let next = openingTag;
    const classes = [];

    next = next.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_attribute, value) => {
      classes.push(...classesFor(parseDeclarations(value)));
      literalAttributes += 1;
      return '';
    });

    next = next.replace(/\s\[style\]\s*=\s*"([^"]*)"/gi, (attribute, expression) => {
      const declarations = parseStaticStyleObject(expression);
      if (!declarations) return attribute;
      classes.push(...classesFor(declarations, true));
      staticBindings += 1;
      return '';
    });

    return addClasses(next, classes);
  });

  if (updated !== original) writeFileSync(file, updated);
}

if (generatedRules.size || !existsSync(generatedScss)) {
  const lines = [
    '/* Generado por scripts/migrate-inline-styles.mjs. No editar manualmente. */',
    '',
  ];
  for (const [className, { property, value }] of [...generatedRules.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`.${className},`);
    lines.push(`.${className}.p-component,`);
    lines.push(`.${className} > .p-component { ${property}: ${value}; }`);
    lines.push('');
  }
  writeFileSync(generatedScss, `${lines.join('\n')}\n`);
}

console.log(`Migrated ${literalAttributes} literal styles and ${staticBindings} static style bindings.`);
console.log(`Generated ${generatedRules.size} reusable property utilities.`);
