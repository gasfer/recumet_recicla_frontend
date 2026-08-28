import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const appRoot = join(resolve(import.meta.dirname, '..'), 'src', 'app');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return extname(entry.name) === '.html' ? [fullPath] : [];
  });
}

let statuses = 0;
let invoiceStates = 0;

for (const file of walk(appRoot)) {
  const original = readFileSync(file, 'utf8');
  let updated = original.replace(
    /\[style\]="([\w.]+\.get\('[^']+'\)!\.value)\s*\?\s*\{\s*'background-color'\s*:\s*'var\(--bg-primary\)'\s*,\s*color\s*:\s*'#ffffff'\s*\}\s*:\s*\{\s*'background-color'\s*:\s*'red'\s*,\s*color\s*:\s*'#ffffff'\s*\}"/g,
    (_match, condition) => {
      statuses += 1;
      return `[styleClass]="${condition} ? 'app-status-active' : 'app-status-inactive'"`;
    },
  );

  updated = updated.replace(
    /\[style\]="\{\s*'background'\s*:\s*([^?]+?)\s*\?\s*'var\(--teal-600\)'\s*:\s*'var\(--bluegray-400\)'\s*\}"/g,
    (_match, condition) => {
      invoiceStates += 1;
      return `[styleClass]="${condition.trim()} ? 'app-invoice-paid' : 'app-invoice-unpaid'"`;
    },
  );

  if (updated !== original) writeFileSync(file, updated);
}

console.log(`Migrated ${statuses} active/inactive tags and ${invoiceStates} invoice-state tags.`);
