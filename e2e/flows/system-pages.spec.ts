import { test, expect } from './support/test';
import { loginAt, pageHeading, reloadPage } from './support/system';
import { content, expectRealText } from './support/ui';

/**
 * System info (`/system-settings/config/system-info`), the page the server
 * settings change links from: it shows what the backend reports about itself.
 */
test.describe.configure({ timeout: 480_000 });
// A missing element fails after a minute, not at the test timeout.
test.use({ actionTimeout: 60_000 });

test('system info: shows what the backend reports about itself', async ({
  page,
  api,
}) => {
  const env = await (await api.raw('GET', '/api/v2/system/environment')).json();
  const platform = env.platform;
  expect(platform?.version, 'environment.platform.version').toBeTruthy();

  await loginAt(page, '/system-settings/config/system-info');
  await expect(pageHeading(page)).toHaveText(/system info/i);
  const c = content(page);

  await expect(c.getByTestId('system-info-license-level')).toContainText(
    platform.license
  );
  const instance = c.locator('.system-info-platform');
  await expect(instance).toContainText(`Version: ${platform.version}`);
  await expect(instance).toContainText(platform.db_driver);
  await expect(instance).toContainText(platform.install_path);
  await expect(instance).toContainText(platform.log_path);
  await expect(instance).toContainText(platform.log_level);
  await expect(instance).toContainText(platform.cache_driver);
  // The license check is answered by the suite's stub: an active paid license.
  await expect(instance).toContainText('Paid');
  await expect(instance).toContainText('2099-12-31');

  // Every package the backend lists is shown with its version.
  const packages: { name: string; version: string }[] = platform.packages;
  expect(packages.length).toBeGreaterThan(20);
  const rows = c.locator('.system-info-packages li');
  await expect(rows).toHaveCount(packages.length);
  const core = packages.find(p => p.name === 'dreamfactory/df-core')!;
  await expect(
    rows.filter({ hasText: 'dreamfactory/df-core' }).first()
  ).toContainText(core.version);

  // Server and client blocks carry real values, no raw i18n keys anywhere.
  const server = c.locator('.system-info-server');
  await expect(server).toContainText(env.server.server_os);
  await expect(server).toContainText(env.php.core.php_version);
  for (const line of (await c.locator('li').allInnerTexts()).slice(0, 14)) {
    expectRealText(line.split(':')[0], 'system info label');
  }

  await reloadPage(page);
  await expect(c.getByTestId('system-info-license-level')).toContainText(
    platform.license
  );
});
