import { test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * MCP service + custom function tool round-trip.
 *
 * TODO — pending stable sidenav navigation (see event-scripts.spec.ts).
 * Intent:
 *  1. Create an MCP service via the admin UI (type = MCP)
 *  2. Add a custom function tool with a simple body: `return a + b;`
 *  3. Save — assert the tool row lands in mcp_custom_tools (via API)
 *  4. Invoke the tool via /mcp/{service} tools/call and assert result
 *
 * This journey previously had three silently-dropped save bugs (see
 * df-mcp-server PR #35 "persist custom tools on service create and on
 * re-save without ids"). End-to-end coverage would have caught them
 * before a customer install.
 */
test.fixme('MCP: create service with custom function tool + invoke it', async ({
  page,
}) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  // TODO
});
