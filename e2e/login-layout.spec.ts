import { test, expect, Page } from '@playwright/test';

const SHORT_AUTH_PATHS = [
  '/dreamfactory/dist/#/auth/login',
  '/dreamfactory/dist/#/auth/forgot-password',
] as const;

async function openAuthCard(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('.user-management-card')).toBeVisible({
    timeout: 15_000,
  });
}

async function paneOverflow(page: Page) {
  return page.evaluate(() => {
    const pane =
      document.querySelector('mat-sidenav-content') ||
      document.querySelector('.sidenav-content');
    if (!pane) {
      return { overflowing: true, reason: 'missing pane' };
    }
    const container = document.querySelector(
      '.user-management-card-container'
    ) as HTMLElement | null;
    return {
      overflowing: pane.scrollHeight > pane.clientHeight + 1,
      paneClientH: pane.clientHeight,
      paneScrollH: pane.scrollHeight,
      containerMarginTop: container
        ? getComputedStyle(container).marginTop
        : null,
      containerHeight: container ? getComputedStyle(container).height : null,
      containerMinHeight: container
        ? getComputedStyle(container).minHeight
        : null,
    };
  });
}

test.describe('Login layout', () => {
  for (const path of SHORT_AUTH_PATHS) {
    test(`desktop ${path} pane does not scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await openAuthCard(page, path);

      const metrics = await paneOverflow(page);
      expect(
        metrics.containerMarginTop,
        `${path} reintroduced a stacked top margin`
      ).toBe('0px');
      expect(
        metrics.overflowing,
        `${path} pane scrolled (${metrics.paneScrollH} > ${metrics.paneClientH}); margin-top=${metrics.containerMarginTop}`
      ).toBe(false);
    });
  }

  test('laptop login pane does not scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openAuthCard(page, '/dreamfactory/dist/#/auth/login');

    const metrics = await paneOverflow(page);
    expect(
      metrics.overflowing,
      `login pane scrolled (${metrics.paneScrollH} > ${metrics.paneClientH}); container margin-top=${metrics.containerMarginTop}`
    ).toBe(false);
  });
});
