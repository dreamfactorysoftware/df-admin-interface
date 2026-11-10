import { test as base } from '@playwright/test';
import { expect } from './expect';
import { FlowApi } from './api';
import { BASE_URL, assertWritableTarget } from './env';
import { Watcher } from './watch';

/**
 * The `test` every flow spec imports: `watch` fails the test on browser
 * errors, `api` deletes tracked records after it, external hosts are stubbed.
 */
interface FlowFixtures {
  watch: Watcher;
  api: FlowApi;
}

// The browser-side license check. The real endpoint is a production service;
// the answer is pinned to an active paid license, as the regression gate does.
const LICENSE_STUB = JSON.stringify({
  status_code: '200',
  msg: 'Paid',
  renewal_date: '2099-12-31',
  disable_ui: 'false',
});
const CALENDLY_STUB =
  'window.Calendly={initInlineWidget:function(){},initPopupWidget:function(){},' +
  'initBadgeWidget:function(){},showPopupWidget:function(){},closePopupWidget:function(){}};';

export const test = base.extend<FlowFixtures>({
  context: async ({ context }, use) => {
    assertWritableTarget();
    const origin = new URL(BASE_URL).origin;
    // Third-party hosts (license check, chat widget, scheduling widget, font
    // and logo CDNs) are answered locally: the suite must not depend on the
    // internet, and must not send test traffic to production services.
    await context.route(
      url => url.origin !== origin && /^https?:$/.test(url.protocol),
      route => {
        const url = new URL(route.request().url());
        if (url.hostname === 'updates.dreamfactory.com') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body: LICENSE_STUB,
          });
        }
        if (url.hostname === 'assets.calendly.com') {
          return route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: CALENDLY_STUB,
          });
        }
        return route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*',
          },
        });
      }
    );
    await use(context);
  },

  watch: [
    async ({ context }, use) => {
      const watcher = new Watcher(context);
      await use(watcher);
      const problems = await watcher.finish();
      expect(
        problems,
        'the browser reported errors during this flow (console.error, uncaught ' +
          'exception, Angular NG code, HTTP >= 400 or failed request):\n' +
          problems.join('\n')
      ).toEqual([]);
    },
    { auto: true },
  ],

  api: async ({ playwright }, use) => {
    // Own request context: the browser's cookies must not leak into API
    // calls, and API logins must not log the browser in.
    const ctx = await playwright.request.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true,
    });
    const api = await FlowApi.login(ctx);
    await use(api);
    const errors = await api.cleanup();
    await ctx.dispose();
    expect(
      errors,
      'cleanup of e2e_ records failed, the stack is left dirty:\n' +
        errors.join('\n')
    ).toEqual([]);
  },
});

export { expect };
