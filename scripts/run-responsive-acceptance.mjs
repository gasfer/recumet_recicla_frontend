import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

await import('./verify-e2e-environment.mjs');

const playwrightCli = resolve('node_modules', '@playwright', 'test', 'cli.js');
const result = spawnSync(process.execPath, [playwrightCli, 'test'], {
  env: { ...process.env, E2E_ACCEPTANCE: 'true' },
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Could not start Playwright acceptance: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) process.exit(result.status ?? 1);

const matrixPath = resolve('docs', 'quality', 'responsive-audit-matrix.json');
const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const accepted = matrix.acceptanceRun === true
  && matrix.completeRun === true
  && matrix.summary?.passed === matrix.entries?.length
  && matrix.summary?.failed === 0
  && matrix.summary?.blocked === 0
  && matrix.summary?.pending === 0;

if (!accepted) {
  console.error('Responsive acceptance did not produce a complete passing audit matrix.');
  process.exit(1);
}
