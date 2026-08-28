import { expect, Page } from '@playwright/test';

export const hasE2ECredentials = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

interface OverflowSnapshot {
  clientWidth: number;
  scrollWidth: number;
  hasGlobalOverflow: boolean;
  resourceCount: number;
  visibleLoadingIndicators: number;
  localContainersOutsideViewport: Array<{ tag: string; className: string; id: string }>;
  overflowing: Array<{ tag: string; className: string; id: string }>;
}

async function readOverflowSnapshot(page: Page): Promise<OverflowSnapshot> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const hasGlobalOverflow = root.scrollWidth > root.clientWidth + 1;
    const localContainersOutsideViewport = [...document.querySelectorAll<HTMLElement>('.app-table-scroll')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > root.clientWidth + 1;
      })
      .slice(0, 10)
      .map((element) => ({
        tag: element.tagName,
        className: element.getAttribute('class') ?? '',
        id: element.id,
      }));
    const overflowing = hasGlobalOverflow
      ? [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const localScroll = Boolean(element.closest('.app-table-scroll'));
          const closedMobileDrawer = root.clientWidth <= 992
            && !document.body.classList.contains('app-sidebar-open')
            && Boolean(element.closest('.vertical-menu'));
          return !localScroll
            && !closedMobileDrawer
            && (rect.left < -1 || rect.right > root.clientWidth + 1);
        })
        .slice(0, 10)
        .map((element) => ({
          tag: element.tagName,
          className: element.getAttribute('class') ?? '',
          id: element.id,
        }))
      : [];
    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      hasGlobalOverflow,
      resourceCount: performance.getEntriesByType('resource').length,
      visibleLoadingIndicators: [...document.querySelectorAll<HTMLElement>(
        'app-table-loading, .p-skeleton, .p-progress-spinner, .spinner-border, [aria-busy="true"]',
      )].filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && rect.width > 0
          && rect.height > 0;
      }).length,
      localContainersOutsideViewport,
      overflowing,
    };
  });
}

export async function assertNoGlobalOverflow(page: Page) {
  let stableSamples = 0;
  let previousResourceCount = -1;
  const stabilizationStartedAt = Date.now();
  await expect.poll(async () => {
    const snapshot = await readOverflowSnapshot(page);
    const isClean = snapshot.localContainersOutsideViewport.length === 0
      && !snapshot.hasGlobalOverflow
      && snapshot.visibleLoadingIndicators === 0;
    const resourcesAreStable = snapshot.resourceCount === previousResourceCount;
    const minimumObservationElapsed = Date.now() - stabilizationStartedAt >= 750;
    stableSamples = isClean && resourcesAreStable && minimumObservationElapsed ? stableSamples + 1 : 0;
    previousResourceCount = snapshot.resourceCount;
    return { stableSamples, snapshot };
  }, {
    intervals: [200, 300, 500],
    timeout: 10_000,
    message: 'The document must remain overflow-free for three consecutive samples.',
  }).toMatchObject({ stableSamples: 3 });
}

export async function expectAuthenticatedPage(page: Page) {
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await expect(page.locator('#page-topbar')).toBeVisible();
}
