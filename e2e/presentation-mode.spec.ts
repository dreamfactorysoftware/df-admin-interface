import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './fixtures/admin-login';
import { DfApi, E2E_SERVICE_PREFIX } from './fixtures/df-api';

/**
 * Presentation mode: one toggle masks every API key and token in the UI so the
 * admin interface can be screenshared without putting live credentials on
 * someone else's monitor.
 *
 * The invariant these tests exist to defend is the awkward one: what is on
 * SCREEN must be masked while what lands on the CLIPBOARD must stay real, so a
 * curl command still pastes into Postman and works.
 */

const HEX_KEY = /\b[0-9a-f]{32,64}\b/;
const MASK = '••••••••••••';
/** A DreamFactory API key (hex) or a session JWT — either may appear in a
 *  generated snippet depending on which identity is selected. */
const CREDENTIAL =
  /\b(?:[0-9a-f]{32,64}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/;

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

async function setPresentation(page: Page, on: boolean) {
  const toggle = page.getByTestId('presentation-toggle');
  await expect(toggle).toBeVisible({ timeout: 10_000 });
  const isOn = (await toggle.getAttribute('aria-pressed')) === 'true';
  if (isOn !== on) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-pressed', String(on));
}

async function gotoApiKeys(page: Page) {
  await page.goto('/dreamfactory/dist/#/api-connections/api-keys');
  await expect(page.locator('table tbody tr').first()).toBeVisible({
    timeout: 15_000,
  });
}

const OIDC_SERVICE = `${E2E_SERVICE_PREFIX}presentation_oidc`;

test.describe('presentation mode', () => {
  test.beforeAll(async ({ request }) => {
    const api = await DfApi.login(request);
    await api.deleteByNamePrefix();
    await api.createServices([
      {
        name: OIDC_SERVICE,
        label: 'E2E presentation mode oidc',
        type: 'oidc',
        is_active: true,
        config: {
          client_id: 'e2e-client-id',
          client_secret: 'e2e-client-secret-value',
          redirect_url: 'https://example.com/cb',
          auth_endpoint: 'https://example.com/auth',
          token_endpoint: 'https://example.com/token',
          scopes: 'openid profile',
        },
      },
    ]);
  });

  test.afterAll(async ({ request }) => {
    const api = await DfApi.login(request);
    await api.deleteByNamePrefix();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('the toggle is reachable from every page and starts off', async ({
    page,
  }) => {
    const toggle = page.getByTestId('presentation-toggle');
    await expect(toggle).toBeVisible({ timeout: 15_000 });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('API keys disappear from the DOM, not just from view', async ({
    page,
  }) => {
    await gotoApiKeys(page);

    // Baseline: the page really is leaking keys before the toggle.
    const before = await page.locator('table').innerText();
    expect(before, 'page must show real keys with the toggle off').toMatch(
      HEX_KEY
    );

    await setPresentation(page, true);

    const after = await page.locator('table').innerText();
    expect(after, 'no API key may survive on screen').not.toMatch(HEX_KEY);
    expect(after).toContain(MASK);

    // innerHTML too: a CSS-only blur would leave the key selectable and
    // recoverable, which is not good enough for a screenshare.
    const html = await page.locator('table').innerHTML();
    expect(html, 'the key must be absent from the markup').not.toMatch(HEX_KEY);
  });

  test('the per-field eye reveals one key without navigating away', async ({
    page,
  }) => {
    await gotoApiKeys(page);

    // Capture a real key first, with masking off, to compare against.
    const rowText = await page.locator('table tbody tr').first().innerText();
    const realKey = rowText.match(HEX_KEY)?.[0];
    expect(realKey, 'needed a real key to compare against').toBeTruthy();

    await setPresentation(page, true);

    const row = page.locator('table tbody tr').first();
    const eye = page.getByTestId('secret-eye').first();
    await expect(eye).toBeVisible();

    await eye.click();
    await expect(row).toContainText(realKey as string);
    // Table rows navigate on click; the eye must not take the list with it.
    expect(page.url()).toContain('/api-connections/api-keys');

    await eye.click();
    await expect(row).not.toContainText(realKey as string);
  });

  test('curl snippets mask the credentials but copy the real command', async ({
    page,
  }) => {
    await page.goto('/dreamfactory/dist/#/api-connections/api-docs/db');
    // The request builder (and with it the export snippets) only renders once
    // an endpoint is picked from the left-hand operation list.
    const op = page.locator('.docs-op').first();
    await expect(op).toBeVisible({ timeout: 25_000 });
    await op.click();

    const snippet = page.locator('.try-it__code').first();
    const copy = page.locator('.try-it__copy').first();
    await expect(snippet).toBeVisible({ timeout: 20_000 });
    await expect(snippet).toContainText('curl');

    // The real command, captured before anything is masked.
    const realSnippet = await snippet.innerText();
    const credential = realSnippet.match(CREDENTIAL)?.[0];
    expect(
      credential,
      'the snippet must carry a credential for this test to mean anything'
    ).toBeTruthy();

    await setPresentation(page, true);

    const shown = await snippet.innerText();
    expect(
      shown,
      'the credential must not be readable on screen'
    ).not.toContain(credential as string);
    expect(shown, 'the command itself must stay legible').toContain('curl');
    expect(shown).toContain(MASK);

    await copy.click();
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    // The whole point: what you paste into Postman is the untouched command.
    expect(
      clip,
      'the clipboard must carry the REAL command, masking is display-only'
    ).toBe(realSnippet);
    expect(clip).toContain(credential as string);
  });

  test('service-config secrets are masked even when the schema calls them text', async ({
    page,
  }) => {
    // oidc.client_secret ships as schema type `text`, so nothing but the field
    // name marks it a credential. That is the case worth pinning down.
    await page.goto('/dreamfactory/dist/#/api-security/authentication');
    const row = page.locator('table tbody tr', { hasText: OIDC_SERVICE });
    await expect(row.first()).toBeVisible({ timeout: 25_000 });
    await row.first().click();

    const secret = page.locator('input[type="text"]').first();
    await expect(secret).toBeVisible({ timeout: 15_000 });
    // Baseline: with the toggle off the secret field is an ordinary text input.
    expect(await page.locator('input[type="password"]').count()).toBe(0);

    await setPresentation(page, true);

    expect(
      await page.locator('input[type="password"]').count(),
      'the credential fields must render as password inputs'
    ).toBeGreaterThan(0);
    expect(
      await page.getByTestId('config-secret-eye').count(),
      'each masked credential field needs its own eye'
    ).toBeGreaterThan(0);

    // client_id is not a secret; hiding it would make OAuth setup painful.
    await expect(
      page.locator('input[type="text"]').filter({ hasNotText: '' }).first()
    ).toBeVisible();
  });

  // A net rather than a single assertion: every route that renders a credential
  // today must stop doing so with the toggle on. A route with nothing to leak
  // fails loudly rather than passing quietly, so this cannot rot into a no-op.
  // Only routes that demonstrably render a credential on this instance. The
  // MCP section leaks keys too, but only once an MCP server has a created key,
  // which this fixture does not set up — covered by the mcp-access-key unit and
  // component tests instead.
  const SWEEP_ROUTES = ['/api-connections/api-keys', '/api-security/api-keys'];

  for (const route of SWEEP_ROUTES) {
    test(`no credential survives on ${route}`, async ({ page }) => {
      await setPresentation(page, false);
      await page.goto(`/dreamfactory/dist/#${route}`);
      await page.waitForLoadState('networkidle');
      const before = await page.locator('body').innerText();
      expect(
        before,
        `${route} has no credential to hide — this guard is not testing anything`
      ).toMatch(CREDENTIAL);

      await setPresentation(page, true);
      await page.goto(`/dreamfactory/dist/#${route}`);
      await page.waitForLoadState('networkidle');

      const after = await page.locator('body').innerText();
      expect(after, `${route} still shows a credential`).not.toMatch(
        CREDENTIAL
      );
    });
  }

  test('the setting survives a reload, so a demo does not start exposed', async ({
    page,
  }) => {
    await gotoApiKeys(page);
    await setPresentation(page, true);

    await page.reload();
    await expect(page.locator('table tbody tr').first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId('presentation-toggle')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(await page.locator('table').innerText()).not.toMatch(HEX_KEY);
  });

  test('turning it off puts the keys back', async ({ page }) => {
    await gotoApiKeys(page);
    await setPresentation(page, true);
    expect(await page.locator('table').innerText()).not.toMatch(HEX_KEY);

    await setPresentation(page, false);
    expect(await page.locator('table').innerText()).toMatch(HEX_KEY);
  });
});
