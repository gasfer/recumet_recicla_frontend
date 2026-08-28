import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appRoot = join(projectRoot, 'src', 'app');
const baselinePath = join(import.meta.dirname, 'inline-style-baseline.json');
const exceptionsPath = join(import.meta.dirname, 'inline-style-exceptions.json');
const writeBaseline = process.argv.includes('--write-baseline');
const strict = process.argv.includes('--strict');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return ['.html', '.ts'].includes(extname(entry.name)) ? [fullPath] : [];
  });
}

function count(file) {
  const content = readFileSync(file, 'utf8');
  const isTemplate = extname(file) === '.html';
  const domStylePattern = /(?:\.style(?:\.[A-Za-z_$][\w$-]*|\[['"][^'"]+['"]\])\s*(?:=|\+=|-=|\*=|\/=|\|\|=|&&=|\?\?=)|\.style\.setProperty\s*\(|\.setAttribute\s*\(\s*['"]style['"]|\.setStyle\s*\(|Object\.assign\s*\([^,\n]+\.style\b)/g;
  return {
    literal: isTemplate ? [...content.matchAll(/\sstyle\s*=\s*['"]/gi)].length : 0,
    styleBinding: isTemplate ? [...content.matchAll(/\[(?:attr\.)?style(?:\.[^\]]+)?\]\s*=\s*['"]/gi)].length : 0,
    ngStyle: isTemplate ? [...content.matchAll(/\[ngStyle\]\s*=\s*['"]/gi)].length : 0,
    domStyle: isTemplate ? 0 : [...content.matchAll(domStylePattern)].length,
  };
}

const current = Object.fromEntries(
  walk(appRoot)
    .map((file) => [relative(projectRoot, file).replaceAll('\\', '/'), count(file)])
    .filter(([, value]) => value.literal || value.styleBinding || value.ngStyle || value.domStyle),
);

if (writeBaseline) {
  writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`Inline style baseline written with ${Object.keys(current).length} files.`);
  process.exit(0);
}

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : {};
const exceptions = existsSync(exceptionsPath) ? JSON.parse(readFileSync(exceptionsPath, 'utf8')) : { bindings: {} };
const errors = [];
const countKeys = ['styleBinding', 'ngStyle', 'domStyle'];

if (!exceptions || typeof exceptions !== 'object' || Array.isArray(exceptions)
  || !exceptions.bindings || typeof exceptions.bindings !== 'object' || Array.isArray(exceptions.bindings)) {
  errors.push('scripts/inline-style-exceptions.json: expected an object with a bindings object.');
}

if (strict && exceptions.bindings && typeof exceptions.bindings === 'object') {
  for (const [file, exception] of Object.entries(exceptions.bindings)) {
    if (!exception || typeof exception !== 'object' || Array.isArray(exception)) {
      errors.push(`${file}: exception must be an object.`);
      continue;
    }
    const unexpectedKeys = Object.keys(exception).filter((key) => ![...countKeys, 'reason'].includes(key));
    if (unexpectedKeys.length) errors.push(`${file}: unexpected exception keys: ${unexpectedKeys.join(', ')}.`);
    if (typeof exception.reason !== 'string' || !exception.reason.trim()) {
      errors.push(`${file}: exception requires a non-empty reason.`);
    }
    for (const key of countKeys) {
      const allowed = exception[key] ?? 0;
      if (!Number.isInteger(allowed) || allowed < 0) errors.push(`${file}: ${key} must be a non-negative integer.`);
    }
    const actual = current[file] ?? { literal: 0, styleBinding: 0, ngStyle: 0, domStyle: 0 };
    for (const key of countKeys) {
      const allowed = exception[key] ?? 0;
      if (actual[key] !== allowed) {
        errors.push(`${file}: stale ${key} exception=${allowed}; current count=${actual[key]}.`);
      }
    }
  }
}

for (const [file, value] of Object.entries(current)) {
  const allowed = strict
    ? { literal: 0, styleBinding: 0, ngStyle: 0, domStyle: 0 }
    : (baseline[file] ?? { literal: 0, styleBinding: 0, ngStyle: 0, domStyle: 0 });
  const bindingException = exceptions.bindings?.[file] ?? { styleBinding: 0, ngStyle: 0, domStyle: 0 };
  const effective = strict
    ? {
        literal: 0,
        styleBinding: bindingException.styleBinding ?? 0,
        ngStyle: bindingException.ngStyle ?? 0,
        domStyle: bindingException.domStyle ?? 0,
      }
    : allowed;
  for (const key of ['literal', ...countKeys]) {
    if (value[key] > (effective[key] ?? 0)) errors.push(`${file}: ${key}=${value[key]} (allowed ${effective[key] ?? 0})`);
  }
}

if (errors.length) {
  console.error('Inline style verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Inline style verification passed (${strict ? 'strict' : 'baseline'} mode).`);
