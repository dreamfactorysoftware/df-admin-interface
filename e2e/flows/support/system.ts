import { Locator, Page } from '@playwright/test';
import { expect } from './expect';
import { APP, ROOT_ADMIN } from './env';
import { submitLogin } from './login';
import { ListPage, content } from './ui';
import { Watcher } from './watch';

/** Routes, page waits, form buttons and write checks shared by the flows. */

/** Hash route of a URL, without the query string. */
export const routeOf = (u: URL): string =>
  u.hash.replace(/^#/, '').split('?')[0];

/** Wait until the app is on this hash route. */
export async function waitForRoute(
  page: Page,
  route: string | RegExp,
  timeout = 60_000
): Promise<void> {
  await page.waitForURL(
    u =>
      typeof route === 'string' ? routeOf(u) === route : route.test(routeOf(u)),
    { timeout }
  );
  await expect(page.locator('.spinner-container')).toHaveCount(0, {
    timeout: 60_000,
  });
}

/** The routed page is painted (generous timeout: the gate stack is shared). */
async function pageReady(page: Page, timeout = 120_000): Promise<void> {
  await expect(page.locator('.spinner-container')).toHaveCount(0, { timeout });
  await expect(
    content(page).getByRole('heading', { level: 1 }).first()
  ).toBeVisible({ timeout });
  await expect(page.locator('.spinner-container')).toHaveCount(0, { timeout });
}

/** Full load of a hash route (as a pasted link), then wait for the page. */
export async function openRoute(page: Page, route: string): Promise<void> {
  const target = `${APP}#${route.startsWith('/') ? route : '/' + route}`;
  const current = page.url();
  await page.goto(target);
  if (current.split('#')[0] === page.url().split('#')[0]) {
    // Same document: the browser only changed the hash. Force a real load.
    await page.reload();
  }
  await pageReady(page);
}

/** Browser reload, then wait for the page. */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
  await pageReady(page);
}

/**
 * Open a protected page the way a person with a bookmark does: go to the
 * link while logged out, log in through the form, land on the page.
 */
export async function loginAt(page: Page, route: string): Promise<void> {
  const path = route.startsWith('/') ? route : '/' + route;
  await page.context().clearCookies();
  await page.goto(`${APP}#${path}`);
  await page.waitForURL(u => u.hash.startsWith('#/auth/login'), {
    timeout: 120_000,
  });
  const res = await submitLogin(page, ROOT_ADMIN);
  expect(res.ok(), `login -> HTTP ${res.status()}`).toBe(true);
  await page.waitForURL(u => routeOf(u) === path, { timeout: 120_000 });
  await pageReady(page);
}

/** The Save / Create / Update button of the form on the page. */
export const saveButton = (page: Page): Locator =>
  content(page).getByRole('button', {
    name: /^\s*(save|create|update)\s*$/i,
  });

export const cancelButton = (page: Page): Locator =>
  content(page).getByRole('button', { name: /^\s*cancel\s*$/i });

/** The page heading (h1) of the routed page. */
export const pageHeading = (page: Page): Locator =>
  content(page).getByRole('heading', { level: 1 }).first();

/**
 * Assert that a click sent no write request to `path` since `mark` (take it
 * with `watch.writes.length` before the action).
 */
export async function expectNoWrite(
  page: Page,
  watch: Watcher,
  mark: number,
  path: RegExp,
  what: string
): Promise<void> {
  // Give a request that was (wrongly) sent the chance to leave the browser:
  // two animation frames plus an idle network.
  await page.evaluate(
    () =>
      new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  await page.waitForLoadState('networkidle');
  expect(
    watch.writes.slice(mark).filter(w => path.test(w.path)),
    `${what}: no write request may be sent`
  ).toEqual([]);
}

/**
 * Find a row in a list that has NO search box (scheduler, CORS, cache): walk
 * the paginator from the first page until the row shows. Returns the row.
 */
export async function findRowByPaging(
  list: ListPage,
  text: string | RegExp
): Promise<Locator> {
  await list.ready();
  if (await list.firstPage().isEnabled()) await list.firstPage().click();
  for (let guard = 0; guard < 200; guard++) {
    const row = list.row(text);
    if (await row.count()) {
      await expect(row, `exactly one row must match ${text}`).toHaveCount(1);
      return row;
    }
    if (!(await list.nextPage().isEnabled())) break;
    const before = (await list.rangeLabel.innerText()).trim();
    await list.nextPage().click();
    await expect(list.rangeLabel).not.toHaveText(before);
  }
  throw new Error(`no row matching ${text} on any page of the list`);
}
