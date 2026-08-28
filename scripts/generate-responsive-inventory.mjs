import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appRoot = join(projectRoot, 'src', 'app');
const outputPath = join(projectRoot, 'docs', 'quality', 'responsive-inventory.json');
const checkOnly = process.argv.includes('--check');

function walk(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath, extension);
    return extname(entry.name) === extension ? [fullPath] : [];
  });
}

function sourcePath(file) {
  return relative(projectRoot, file).replaceAll('\\', '/');
}

function dialogVariant(openingTag) {
  const classVariant = openingTag.match(/\bapp-dialog--(sm|md|lg|xl)\b/i);
  if (classVariant) return { variant: classVariant[1].toLowerCase(), source: 'class' };

  const width = openingTag.match(/width\s*:\s*['"]([0-9.]+)(px|vw|rem|%)['"]/i);
  if (!width) return { variant: 'unclassified', source: 'missing' };
  const value = Number(width[1]);
  const unit = width[2].toLowerCase();
  if ((unit === 'px' && value <= 540) || (unit === 'vw' && value <= 38) || (unit === 'rem' && value <= 34)) {
    return { variant: 'sm', source: 'legacy-width' };
  }
  if ((unit === 'px' && value <= 760) || (unit === 'vw' && value <= 60) || (unit === 'rem' && value <= 52)) {
    return { variant: 'md', source: 'legacy-width' };
  }
  if ((unit === 'px' && value <= 1100) || (unit === 'vw' && value <= 80)) {
    return { variant: 'lg', source: 'legacy-width' };
  }
  return { variant: 'xl', source: 'legacy-width' };
}

function tableStrategy(openingTag) {
  if (/\bapp-table--stack\b/i.test(openingTag) || /responsiveLayout\s*=\s*['"]stack['"]/i.test(openingTag)) {
    return { strategy: 'stack', source: 'explicit' };
  }
  if (/\bapp-table-scroll\b/i.test(openingTag) || /responsiveLayout\s*=\s*['"]scroll['"]/i.test(openingTag)) {
    return { strategy: 'scroll', source: 'explicit' };
  }
  if (/\[responsiveLayout\]\s*=\s*['"]responsiveStrategy['"]/i.test(openingTag)
    && /\[attr\.data-responsive-strategy\]\s*=\s*['"]responsiveStrategy['"]/i.test(openingTag)) {
    return { strategy: 'consumer-controlled', source: 'bound-input' };
  }
  const configurableDefault = openingTag.match(/data-responsive-default\s*=\s*['"](stack|scroll)['"]/i);
  if (configurableDefault) {
    return { strategy: configurableDefault[1].toLowerCase(), source: 'configurable-default' };
  }
  return { strategy: 'unclassified', source: 'missing' };
}

function sharedTableStrategy(openingTag) {
  const explicit = openingTag.match(/\bresponsiveStrategy\s*=\s*['"](stack|scroll)['"]/i);
  return explicit
    ? { strategy: explicit[1].toLowerCase(), source: 'explicit-input' }
    : { strategy: 'unclassified', source: 'missing' };
}

function domStyleCount(content) {
  const pattern = /(?:\.style(?:\.[A-Za-z_$][\w$-]*|\[['"][^'"]+['"]\])\s*(?:=|\+=|-=|\*=|\/=|\|\|=|&&=|\?\?=)|\.style\.setProperty\s*\(|\.setAttribute\s*\(\s*['"]style['"]|\.setStyle\s*\(|Object\.assign\s*\([^,\n]+\.style\b)/g;
  return [...content.matchAll(pattern)].length;
}

const htmlFiles = walk(appRoot, '.html');
const dialogs = [];
const tables = [];
const tableConsumers = [];
const inlineStyles = [];

for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf8');
  const path = sourcePath(file);

  for (const match of content.matchAll(/<p-dialog\b[\s\S]*?>/gi)) {
    const openingTag = match[0];
    const classification = dialogVariant(openingTag);
    dialogs.push({
      file: path,
      ...classification,
      hasBreakpoints: /\[breakpoints\]/i.test(openingTag),
      hasExplicitWidth: /\[(?:attr\.)?style(?:\.width(?:\.px)?)?\]|\[ngStyle\]|\sstyle\s*=/i.test(openingTag),
    });
  }

  const primeTables = [...content.matchAll(/<p-table\b[\s\S]*?>/gi)];
  const nativeTables = [...content.matchAll(/<table\b[\s\S]*?>/gi)];
  for (const match of [...primeTables, ...nativeTables]) {
    const openingTag = match[0];
    const classification = tableStrategy(openingTag);
    tables.push({ file: path, kind: openingTag.startsWith('<p-table') ? 'primeng' : 'html', ...classification });
  }

  let consumerOccurrence = 0;
  for (const match of content.matchAll(/<app-table(?=[\s>])[\s\S]*?>/gi)) {
    consumerOccurrence += 1;
    const openingTag = match[0];
    tableConsumers.push({
      file: path,
      occurrence: consumerOccurrence,
      colsBinding: openingTag.match(/\[cols\]\s*=\s*['"]([^'"]+)['"]/i)?.[1] ?? '',
      condition: openingTag.match(/\*ngIf\s*=\s*['"]([^'"]+)['"]/i)?.[1] ?? '',
      ...sharedTableStrategy(openingTag),
    });
  }

  const literal = [...content.matchAll(/\sstyle\s*=\s*['"]/gi)].length;
  const styleBinding = [...content.matchAll(/\[(?:attr\.)?style(?:\.[^\]]+)?\]\s*=\s*['"]/gi)].length;
  const ngStyle = [...content.matchAll(/\[ngStyle\]\s*=\s*['"]/gi)].length;
  if (literal || styleBinding || ngStyle) inlineStyles.push({ file: path, literal, styleBinding, ngStyle, domStyle: 0 });
}

for (const file of walk(appRoot, '.ts')) {
  const content = readFileSync(file, 'utf8');
  const domStyle = domStyleCount(content);
  if (domStyle) inlineStyles.push({ file: sourcePath(file), literal: 0, styleBinding: 0, ngStyle: 0, domStyle });
}

const navigationFile = join(appRoot, 'core', 'constants', 'application-navigation.constants.ts');
const navigationContent = readFileSync(navigationFile, 'utf8');
const routes = [...new Set([...navigationContent.matchAll(/\bdestination\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]))].sort();

const inventory = {
  generatedBy: 'npm run responsive:inventory',
  viewports: [320, 360, 390, 768, 1024, 1366],
  totals: {
    routes: routes.length,
    dialogs: dialogs.length,
    tables: tables.length,
    tableConsumers: tableConsumers.length,
    stackTableConsumers: tableConsumers.filter(({ strategy }) => strategy === 'stack').length,
    scrollTableConsumers: tableConsumers.filter(({ strategy }) => strategy === 'scroll').length,
    literalStyles: inlineStyles.reduce((sum, item) => sum + item.literal, 0),
    styleBindings: inlineStyles.reduce((sum, item) => sum + item.styleBinding, 0),
    ngStyleBindings: inlineStyles.reduce((sum, item) => sum + item.ngStyle, 0),
    domStyleAssignments: inlineStyles.reduce((sum, item) => sum + item.domStyle, 0),
  },
  routes,
  dialogs,
  tables,
  tableConsumers,
  inlineStyles,
};

const unclassifiedDialogs = dialogs.filter(({ variant }) => variant === 'unclassified');
const unclassifiedTables = tables.filter(({ strategy }) => strategy === 'unclassified');
const unclassifiedConsumers = tableConsumers.filter(({ strategy }) => strategy === 'unclassified');
if (unclassifiedDialogs.length || unclassifiedTables.length || unclassifiedConsumers.length) {
  const details = [
    ...unclassifiedDialogs.map(({ file }) => `dialog: ${file}`),
    ...unclassifiedTables.map(({ file }) => `table: ${file}`),
    ...unclassifiedConsumers.map(({ file, occurrence }) => `table consumer: ${file} #${occurrence}`),
  ];
  throw new Error(`Responsive inventory contains unclassified elements:\n${details.join('\n')}`);
}

const serializedInventory = `${JSON.stringify(inventory, null, 2)}\n`;

if (checkOnly) {
  if (!existsSync(outputPath)) throw new Error(`Responsive inventory is missing: ${sourcePath(outputPath)}`);
  const recordedInventory = readFileSync(outputPath, 'utf8').replaceAll('\r\n', '\n');
  if (recordedInventory !== serializedInventory) {
    throw new Error('Responsive inventory is outdated. Run npm run responsive:inventory.');
  }
  console.log(`Responsive inventory verified (${dialogs.length} dialogs, ${tables.length} tables).`);
  process.exit(0);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serializedInventory);
console.log(`Responsive inventory written to ${sourcePath(outputPath)}`);
console.log(JSON.stringify(inventory.totals));
