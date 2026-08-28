import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appRoot = join(projectRoot, 'src', 'app');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extname(entry.name) === '.html' ? [fullPath] : [];
  });
}

function variantFor(openingTag) {
  const width = openingTag.match(/width\s*:\s*['"]([0-9.]+)(px|vw|rem|%)['"]/i);
  if (!width) return 'md';
  const value = Number(width[1]);
  const unit = width[2].toLowerCase();
  if ((unit === 'px' && value <= 540) || (unit === 'vw' && value <= 38) || (unit === 'rem' && value <= 34)) return 'sm';
  if ((unit === 'px' && value <= 760) || (unit === 'vw' && value <= 60) || (unit === 'rem' && value <= 52)) return 'md';
  if ((unit === 'px' && value <= 1100) || (unit === 'vw' && value <= 80)) return 'lg';
  return 'xl';
}

let migrated = 0;
for (const file of walk(appRoot)) {
  const original = readFileSync(file, 'utf8');
  const updated = original.replace(/<p-dialog\b[\s\S]*?>/gi, (openingTag) => {
    if (/styleClass\s*=\s*['"][^'"]*app-dialog--/i.test(openingTag)) return openingTag;
    const variant = `app-dialog--${variantFor(openingTag)}`;
    let next = openingTag
      .replace(/\s*\[breakpoints\]\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/\s*\[style\]\s*=\s*("\s*\{[\s\S]*?width\s*:\s*['"][^'"]+['"][\s\S]*?\}\s*"|'\s*\{[\s\S]*?width\s*:\s*"[^"]+"[\s\S]*?\}\s*')/gi, '');

    if (/\sstyleClass\s*=\s*['"]/i.test(next)) {
      next = next.replace(/styleClass\s*=\s*(['"])([^'"]*)\1/i, (_match, quote, classes) => `styleClass=${quote}${classes} ${variant}${quote}`);
    } else {
      next = next.replace(/\s*>$/, ` styleClass="${variant}">`);
    }
    migrated += 1;
    return next;
  });
  if (updated !== original) writeFileSync(file, updated);
}

console.log(`Responsive variants applied to ${migrated} dialogs.`);
