import { test, expect } from './support/test';
import { loginAsRoot, waitForShell } from './support/login';
import { uniqueName } from './support/names';
import { SERVICE_ENDPOINT, SERVICE_LISTS } from './support/services';
import { openRoute, routeOf } from './support/system';
import { ListPage, expectRealText, expectSnackbar } from './support/ui';

/**
 * MCP servers (`/ai/mcp`): create with validation and service search, the
 * Settings round trip, deactivate, typed delete. Names use the kind `mcpsrv`
 * because older specs delete every `e2e_mcp_*` service.
 */
test.describe.configure({ timeout: 900_000 });

const LIST = SERVICE_LISTS.mcp;

// The editor asks for the live tool list; no MCP daemon runs on the gate stack.
test.beforeEach(({ watch }) => {
  watch.allowHttp({
    status: [400, 401, 403, 404, 405, 500, 502, 503, 504],
    url: /^\/(mcp\/[a-z0-9_-]+|api\/v2\/[a-z0-9_-]+\/rpc|_internal\/ai\/mcp-)/,
    reason: 'no MCP daemon runs on the gate stack',
    optional: true,
  });
});

test('MCP server: create with a service found by search, edit in Settings, deactivate, delete', async ({
  page,
  api,
  watch,
}) => {
  const name = uniqueName('mcpsrv');
  const label = `Flow MCP ${name}`;
  const description = 'Flow suite: MCP server over one database';
  // Far down the list of 57 databases the create page offers.
  const exposed = 'gate_trino_01';

  await loginAsRoot(page);
  const list = new ListPage(page, SERVICE_ENDPOINT);

  await test.step('open the create page from the list', async () => {
    await openRoute(page, LIST);
    await list.ready();
    await list.createButton.click();
    await page.waitForURL(u => routeOf(u) === `${LIST}/create`);
    await expect(page.getByTestId('mcp-create-page')).toBeVisible({
      timeout: 30_000,
    });
  });

  const nameInput = page.getByTestId('mcp-create-name');
  const submit = page.getByTestId('mcp-create-submit');

  await test.step('validation: no name, then a name that is taken', async () => {
    await expect(submit, 'nothing to create without a name').toBeDisabled();
    await nameInput.focus();
    await nameInput.blur();
    await expect(page.getByTestId('mcp-create-page')).toContainText(
      'Name is required.'
    );
    await nameInput.fill('gate_mcp_01');
    await expect(page.getByTestId('mcp-create-page')).toContainText(
      'A service named gate_mcp_01 already exists.'
    );
    await expect(submit).toBeDisabled();
    expect(watch.writesTo(/\/api\/v2\/system\/service/)).toEqual([]);
  });

  await test.step('name, label, description; the URL preview follows the name', async () => {
    await nameInput.fill(name);
    await expect(page.getByTestId('mcp-create-url-preview')).toContainText(
      `/mcp/${name}`
    );
    await page.locator('#mcp-create-label-input').fill(label);
    await page.getByRole('button', { name: '+ Add description' }).click();
    await page.locator('#mcp-create-desc-input').fill(description);
    await expect(submit).toBeEnabled();
  });

  await test.step('choose services: the search finds a database far down the list', async () => {
    await page.getByRole('button', { name: 'Choose services' }).click();
    const search = page.getByTestId('mcp-create-search');
    await search.fill('zz-no-such-service');
    await expect(page.getByTestId('mcp-create-page')).toContainText(
      "No service matches 'zz-no-such-service'."
    );
    await search.fill('trino');
    const row = page.getByTestId(`mcp-create-svc-${exposed}`);
    await expect(row).toBeVisible();
    // The search narrowed the list: seeded MySQL services are gone from it.
    await expect(page.getByTestId('mcp-create-svc-gate_mysql_01')).toHaveCount(
      0
    );
    await row.click();
    await search.fill('');
    const consequence = page.getByTestId('mcp-create-consequence');
    await expect(consequence).toContainText(/Agents will get \d+ tools/);
    expectRealText(await consequence.innerText(), 'create consequence line');
    await expect(page.getByTestId('mcp-create-access-ro')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  let id = 0;
  await test.step('create: lands on the Connect tab of the new server', async () => {
    api.track('service', name);
    const posted = page.waitForResponse(
      r =>
        r.request().method() === 'POST' &&
        new URL(r.url()).pathname.startsWith(SERVICE_ENDPOINT)
    );
    await submit.click();
    const res = await posted;
    expect(
      res.ok(),
      `POST system/service -> HTTP ${res.status()}: ${(await res.text()).slice(0, 300)}`
    ).toBe(true);
    id = (await res.json()).resource[0].id;
    await page.waitForURL(
      u => routeOf(u) === `${LIST}/${id}` && u.hash.includes('created=1')
    );
    await expect(page.getByTestId('mcp-connect-tab')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('mcp-endpoint-url').first()).toContainText(
      `/mcp/${name}`
    );
  });

  await test.step('the API record carries what was entered', async () => {
    const rec = await api.get('service', id);
    expect(rec).toMatchObject({
      name,
      label,
      description,
      type: 'mcp',
      is_active: true,
    });
    // The exposure list exists on backends with the MCP exposure package;
    // where the key is stored, it must hold exactly the picked service.
    if (rec.config && 'exposed_services' in rec.config) {
      expect(rec.config.exposed_services).toEqual([exposed]);
    }
  });

  const dirtyBar = page.getByTestId('mcp-dirty-bar');
  const setLabel = page.getByTestId('mcp-set-label');
  const setDescription = page.getByTestId('mcp-set-description');
  const editedLabel = `${label} edited`;
  const isUpdate = (r: { url(): string; request(): any }) =>
    ['PUT', 'PATCH'].includes(r.request().method()) &&
    new URL(r.url()).pathname.startsWith(`${SERVICE_ENDPOINT}/${id}`);

  await test.step('Settings: the saved values are shown; an edit raises the save bar', async () => {
    await page.getByTestId('mcp-tab-settings').click();
    await expect(page.getByTestId('mcp-settings-tab')).toBeVisible();
    await expect(page.getByTestId('mcp-set-name')).toHaveValue(name);
    await expect(setLabel).toHaveValue(label);
    await expect(setDescription).toHaveValue(description);
    await expect(dirtyBar).toHaveCount(0);
    await setLabel.fill('thrown away');
    await expect(dirtyBar).toBeVisible();
  });

  await test.step('Discard restores the saved values and sends nothing', async () => {
    const before = watch.writesTo(/\/api\/v2\/system\/service/).length;
    await page.getByTestId('mcp-discard').click();
    await expect(dirtyBar).toHaveCount(0);
    await expect(setLabel).toHaveValue(label);
    expect(watch.writesTo(/\/api\/v2\/system\/service/).length).toBe(before);
  });

  await test.step('Save: label and description are stored and survive a reload', async () => {
    await setLabel.fill(editedLabel);
    await setDescription.fill(`${description} (edited)`);
    const saved = page.waitForResponse(isUpdate);
    await page.getByTestId('mcp-save').click();
    expect((await saved).ok()).toBe(true);
    await expect(dirtyBar).toHaveCount(0);

    await page.reload();
    await waitForShell(page);
    await page.getByTestId('mcp-tab-settings').click();
    await expect(setLabel).toHaveValue(editedLabel);
    await expect(setDescription).toHaveValue(`${description} (edited)`);
    const rec = await api.get('service', id);
    expect(rec.label).toBe(editedLabel);
    expect(rec.description).toBe(`${description} (edited)`);
    expect(rec.name).toBe(name);
  });

  await test.step('deactivate: the page warns, the API agrees', async () => {
    await page.getByTestId('mcp-set-active').getByRole('switch').click();
    await expect(page.getByTestId('mcp-settings-tab')).toContainText(
      'This server is inactive'
    );
    const saved = page.waitForResponse(isUpdate);
    await page.getByTestId('mcp-save').click();
    expect((await saved).ok()).toBe(true);
    await expect(dirtyBar).toHaveCount(0);
    expect((await api.get('service', id)).is_active).toBe(false);
  });

  await test.step('delete: a wrong name in the confirmation deletes nothing', async () => {
    page.once('dialog', d => d.accept('not-the-name'));
    await page.getByTestId('mcp-delete-server').click();
    await expect(page.getByTestId('mcp-settings-tab')).toBeVisible();
    expect(await api.findByName('service', name)).not.toBeNull();
    expect(
      watch
        .writesTo(/\/api\/v2\/system\/service/)
        .filter(w => w.method === 'DELETE')
    ).toEqual([]);
  });

  await test.step('delete: the typed name removes the server and returns to the list', async () => {
    page.once('dialog', d => d.accept(name));
    const deleted = page.waitForResponse(
      r =>
        r.request().method() === 'DELETE' &&
        new URL(r.url()).pathname.startsWith(`${SERVICE_ENDPOINT}/${id}`)
    );
    await page.getByTestId('mcp-delete-server').click();
    expect((await deleted).ok()).toBe(true);
    await expectSnackbar(page, /server deleted/i);
    await page.waitForURL(u => routeOf(u) === LIST);
    await list.ready();
    await list.search(name);
    await expect(list.row(name)).toHaveCount(0);
    expect(await api.findByName('service', name)).toBeNull();
  });
});
