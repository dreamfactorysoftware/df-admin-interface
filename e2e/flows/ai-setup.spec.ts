import { test, expect } from './support/test';
import { loginAsRoot, waitForShell } from './support/login';
import { openRoute, routeOf } from './support/system';
import { content } from './support/ui';

/** The AI setup page (`/ai/setup`): every card opens a page that renders. */
test.describe.configure({ timeout: 900_000 });

const CARDS: { name: string; route: string; shows: RegExp }[] = [
  { name: 'Connections', route: '/ai/connections', shows: /connection/i },
  {
    name: 'Role-Based Access',
    route: '/api-connections/role-based-access',
    shows: /role/i,
  },
  { name: 'Chat Configuration', route: '/ai/chat-services', shows: /chat/i },
  { name: 'Conversations', route: '/ai/chat', shows: /AI Chat/ },
  { name: 'MCP', route: '/ai/mcp', shows: /mcp/i },
  { name: 'Usage', route: '/ai/usage', shows: /AI Usage Analytics/ },
];

test('AI setup: every card leads to its page, and Back returns to the setup page', async ({
  page,
}) => {
  await loginAsRoot(page);
  await openRoute(page, '/ai/setup');
  const c = content(page);
  await expect(c).toContainText('Bring AI to your DreamFactory data', {
    timeout: 30_000,
  });

  for (const card of CARDS) {
    await test.step(card.name, async () => {
      const link = c.locator(`a.section-card[aria-label="${card.name}"]`);
      await expect(link).toHaveAttribute('href', `#${card.route}`);
      await link.click();
      await page.waitForURL(u => routeOf(u) === card.route);
      await waitForShell(page);
      await expect(content(page)).toContainText(card.shows, {
        timeout: 60_000,
      });
      await page.goBack();
      await page.waitForURL(u => routeOf(u) === '/ai/setup');
      await expect(c).toContainText('Bring AI to your DreamFactory data');
    });
  }
});
