import type { FullResult, Reporter, TestCase, TestError, TestResult } from '@playwright/test/reporter';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type AuditStatus = 'passed' | 'failed' | 'blocked' | 'pending';

interface AuditEntry {
  route: string;
  viewport: number;
  status: AuditStatus;
  retry: number;
  incident: string;
}

const projectRoot = path.resolve(__dirname, '..', '..');
const inventoryPath = path.join(projectRoot, 'docs', 'quality', 'responsive-inventory.json');
const jsonOutputPath = path.join(projectRoot, 'docs', 'quality', 'responsive-audit-matrix.json');
const markdownOutputPath = path.join(projectRoot, 'docs', 'quality', 'responsive-audit-matrix.md');
const partialOutputDirectory = path.join(projectRoot, 'test-results');
const requiredScenarioFilesByTitle = new Map<string, string>([
  ['table overflow remains local', 'components-responsive.spec.ts'],
  ['representative table keeps sorting, pagination and actions operable', 'components-responsive.spec.ts'],
  ['representative dialog stays inside the viewport', 'components-responsive.spec.ts'],
  ['sidebar and topbar remain operable', 'shell-responsive.spec.ts'],
  ['orientation-like resize preserves work context', 'shell-responsive.spec.ts'],
  ['keyboard operation preserves visible focus and mobile menu state', 'shell-responsive.spec.ts'],
]);

function scenarioKey(projectName: string, title: string): string {
  return `${projectName}|${title}`;
}

function countStatuses(statuses: Iterable<TestResult['status']>): Record<string, number> {
  return Object.fromEntries(
    [...statuses].reduce((totals, status) => {
      totals.set(status, (totals.get(status) ?? 0) + 1);
      return totals;
    }, new Map<string, number>()),
  );
}

function normalizeIncident(value: string | undefined): string {
  return (value ?? '').replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1000);
}

function auditStatus(result: TestResult): AuditStatus {
  if (result.status === 'passed') return 'passed';
  if (result.status === 'skipped') return 'blocked';
  return 'failed';
}

function statusLabel(status: AuditStatus): string {
  return {
    passed: 'OK',
    failed: 'FALLÓ',
    blocked: 'BLOQUEADA',
    pending: 'PENDIENTE',
  }[status];
}

export default class ResponsiveAuditReporter implements Reporter {
  private readonly results = new Map<string, AuditEntry>();
  private readonly projects = new Set<string>();
  private readonly globalErrors: string[] = [];
  private readonly testStatuses = new Map<string, TestResult['status']>();
  private readonly testAttemptStatuses: TestResult['status'][] = [];
  private readonly testsWithNonPassingAttempts = new Set<string>();
  private readonly requiredScenarioResults = new Set<string>();

  onError(error: TestError): void {
    this.globalErrors.push(normalizeIncident(error.message));
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.testStatuses.set(test.id, result.status);
    this.testAttemptStatuses.push(result.status);
    if (result.status !== 'passed') this.testsWithNonPassingAttempts.add(test.id);

    const projectName = test.parent.project()?.name ?? '';
    const viewportMatch = projectName.match(/^viewport-(\d+)$/);
    if (viewportMatch) this.projects.add(projectName);

    const requiredScenarioFile = requiredScenarioFilesByTitle.get(test.title);
    if (viewportMatch && requiredScenarioFile === path.basename(test.location.file)) {
      this.requiredScenarioResults.add(scenarioKey(projectName, test.title));
    }

    const routeMatch = test.title.match(/^(\/\S+) fits the viewport$/);
    if (!routeMatch || !viewportMatch) return;

    const status = auditStatus(result);
    const annotation = result.annotations.find(({ type }) => type === 'skip')?.description;
    const incident = status === 'passed'
      ? ''
      : normalizeIncident(result.error?.message ?? annotation ?? `Playwright status: ${result.status}`);
    const entry: AuditEntry = {
      route: routeMatch[1],
      viewport: Number(viewportMatch[1]),
      status,
      retry: result.retry,
      incident,
    };
    this.results.set(`${entry.route}|${entry.viewport}`, entry);
  }

  onEnd(result: FullResult): void | { status: 'failed' } {
    const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8')) as {
      routes: string[];
      viewports: number[];
    };
    const entries = inventory.routes.flatMap((route) => inventory.viewports.map((viewport) => (
      this.results.get(`${route}|${viewport}`) ?? {
        route,
        viewport,
        status: 'pending' as const,
        retry: 0,
        incident: 'No se ejecutó en esta corrida.',
      }
    )));
    const summary = entries.reduce<Record<AuditStatus, number>>((totals, entry) => {
      totals[entry.status] += 1;
      return totals;
    }, { passed: 0, failed: 0, blocked: 0, pending: 0 });
    const completedNavigationEntries = entries.filter(({ route, viewport }) => (
      this.results.has(`${route}|${viewport}`)
    )).length;
    const expectedRequiredScenarioKeys = inventory.viewports.flatMap((viewport) => (
      [...requiredScenarioFilesByTitle.keys()].map((title) => scenarioKey(`viewport-${viewport}`, title))
    ));
    const missingRequiredScenarios = expectedRequiredScenarioKeys.filter((key) => (
      !this.requiredScenarioResults.has(key)
    ));
    const isCompleteRun = completedNavigationEntries === entries.length
      && missingRequiredScenarios.length === 0;
    const acceptanceRun = process.env.E2E_ACCEPTANCE === 'true';
    const hasNonPassingTests = [...this.testStatuses.values()].some((status) => status !== 'passed');
    const hasNonPassingAttempts = this.testsWithNonPassingAttempts.size > 0;
    const writesCanonicalEvidence = acceptanceRun
      && isCompleteRun
      && result.status === 'passed'
      && !hasNonPassingTests
      && !hasNonPassingAttempts
      && this.globalErrors.length === 0
      && summary.passed === entries.length;
    const selectedJsonOutputPath = writesCanonicalEvidence
      ? jsonOutputPath
      : path.join(partialOutputDirectory, 'responsive-audit-partial.json');
    const selectedMarkdownOutputPath = writesCanonicalEvidence
      ? markdownOutputPath
      : path.join(partialOutputDirectory, 'responsive-audit-partial.md');
    mkdirSync(path.dirname(selectedJsonOutputPath), { recursive: true });

    writeFileSync(selectedJsonOutputPath, `${JSON.stringify({
      generatedBy: `Playwright (${[...this.projects].sort().join(', ') || 'sin proyectos completados'})`,
      generatedAt: new Date().toISOString(),
      completeRun: isCompleteRun,
      acceptanceRun,
      globalErrors: this.globalErrors,
      coverage: {
        navigation: { observed: completedNavigationEntries, expected: entries.length },
        requiredScenarios: {
          observed: expectedRequiredScenarioKeys.length - missingRequiredScenarios.length,
          expected: expectedRequiredScenarioKeys.length,
          missing: missingRequiredScenarios,
        },
      },
      testStatuses: countStatuses(this.testStatuses.values()),
      testAttemptStatuses: countStatuses(this.testAttemptStatuses),
      testsWithNonPassingAttempts: this.testsWithNonPassingAttempts.size,
      summary,
      entries,
    }, null, 2)}\n`);

    const byKey = new Map(entries.map((entry) => [`${entry.route}|${entry.viewport}`, entry]));
    const header = `| Destino | ${inventory.viewports.join(' | ')} |`;
    const separator = `|---|${inventory.viewports.map(() => '---').join('|')}|`;
    const rows = inventory.routes.map((route) => {
      const statuses = inventory.viewports.map((viewport) => statusLabel(byKey.get(`${route}|${viewport}`)!.status));
      return `| \`${route}\` | ${statuses.join(' | ')} |`;
    });
    const incidents = entries
      .filter(({ status }) => status === 'failed' || status === 'blocked')
      .map(({ route, viewport, status, incident }) => `- \`${route}\` @ ${viewport}px — ${statusLabel(status)}: ${incident}`);
    const globalIncidents = this.globalErrors.map((incident) => `- Error global: ${incident}`);
    const coverageIncidents = missingRequiredScenarios.map((key) => (
      `- Escenario obligatorio no ejecutado: ${key.replace('|', ' — ')}.`
    ));
    const markdown = [
      `# Matriz ${writesCanonicalEvidence ? '' : 'parcial '}de auditoría responsiva`,
      '',
      `Proyectos observados: ${[...this.projects].sort().join(', ') || 'ninguno'}. Combinaciones esperadas: ${entries.length}.`,
      `Escenarios obligatorios observados: ${expectedRequiredScenarioKeys.length - missingRequiredScenarios.length}/${expectedRequiredScenarioKeys.length}.`,
      '',
      `Resumen: ${summary.passed} OK, ${summary.failed} fallidas, ${summary.blocked} bloqueadas y ${summary.pending} pendientes.`,
      '',
      header,
      separator,
      ...rows,
      '',
      '## Incidencias',
      '',
      ...(incidents.length || globalIncidents.length || coverageIncidents.length
        ? [...globalIncidents, ...coverageIncidents, ...incidents]
        : ['- Sin incidencias registradas.']),
      '',
    ].join('\n');
    writeFileSync(selectedMarkdownOutputPath, markdown);

    if (acceptanceRun && (
      !isCompleteRun
      || result.status !== 'passed'
      || hasNonPassingTests
      || hasNonPassingAttempts
      || this.globalErrors.length > 0
      || summary.failed > 0
      || summary.blocked > 0
      || summary.pending > 0
    )) {
      return { status: 'failed' };
    }
  }
}
