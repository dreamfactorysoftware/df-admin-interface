import { test, expect } from './support/test';
import { loginAsRoot } from './support/login';
import { uniqueName } from './support/names';
import {
  allowAceModeDefect,
  arrayField,
  arrayRows,
  expandOptions,
  expectFieldInvalid,
  fillBase,
  openCreateForm,
  saveNewService,
  SERVICE_LISTS,
  serviceForm,
} from './support/services';
import { expectNoWrite, routeOf } from './support/system';
import { content, field } from './support/ui';

/**
 * HTTP service (type `rws`) on the generic, schema-driven service form:
 * required-field validation and a create through Import from cURL
 * read back from the API.
 */
test.describe.configure({ timeout: 900_000 });

test.beforeEach(({ watch }) => {
  allowAceModeDefect(watch);
});

const LIST = SERVICE_LISTS.network;
const TYPE = 'HTTP Service';
const BASE_URL_LABEL =
  'Base URL (required if not defined in Service Definition)';

test('HTTP service: an empty form is not sent, the missing name is marked', async ({
  page,
  watch,
}) => {
  await loginAsRoot(page);
  await openCreateForm(page, LIST, TYPE);
  const f = serviceForm(page);
  const mark = watch.writes.length;
  await f.save.click();
  await expectFieldInvalid(
    f.name,
    'the required Namespace field is marked invalid'
  );
  expect(routeOf(new URL(page.url()))).toBe(`${LIST}/create`);
  await expectNoWrite(
    page,
    watch,
    mark,
    /\/api\/v2\/system\/service/,
    'an empty form'
  );
});

test('HTTP service: Import from cURL fills the base URL, parameters, headers and options', async ({
  page,
  api,
}) => {
  const name = uniqueName('http');
  await loginAsRoot(page);
  await openCreateForm(page, LIST, TYPE);
  await fillBase(page, {
    name,
    label: 'from cURL',
    description: 'prefilled by the cURL import dialog',
    active: true,
  });

  await page.getByTestId('open-curl-import').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('curl-import-submit')).toBeDisabled();
  await page
    .getByTestId('curl-import-command')
    .fill(
      "curl -X POST 'https://api.example.com/v2/orders?limit=25&status=open' " +
        "-H 'Authorization: Bearer flow-suite-token' -H 'Accept: application/json'"
    );
  await expect(page.getByTestId('curl-import-base-url')).toHaveText(
    'https://api.example.com/v2/orders'
  );
  await page.getByTestId('curl-import-submit').click();
  await expect(dialog).toHaveCount(0);

  const baseUrl = 'https://api.example.com/v2/orders';
  await expect(field(content(page), BASE_URL_LABEL)).toHaveValue(baseUrl);
  await expandOptions(page);
  // name, value as shown in the first two cells and as stored (action 2 = POST)
  const imported = {
    parameters: [
      ['limit', '25'],
      ['status', 'open'],
    ],
    headers: [
      ['Authorization', 'Bearer flow-suite-token'],
      ['Accept', 'application/json'],
    ],
  };
  for (const [key, label] of [
    ['parameters', 'Parameters'],
    ['headers', 'Headers'],
  ] as const) {
    const rows = arrayRows(arrayField(page, label));
    await expect(rows, label).toHaveCount(imported[key].length);
    for (const [i, [n, v]] of imported[key].entries()) {
      const cells = rows.nth(i).locator('td');
      await expect(cells.nth(0).locator('input')).toHaveValue(n);
      await expect(cells.nth(1).locator('input')).toHaveValue(v);
    }
  }
  await expect(arrayRows(arrayField(page, 'CURL Options'))).toHaveCount(0);

  const id = await saveNewService(page, api, name);
  const { config } = await api.get('service', id);
  expect(config.base_url).toBe(baseUrl);
  for (const key of ['parameters', 'headers'] as const) {
    expect(config[key]).toHaveLength(imported[key].length);
    imported[key].forEach(([n, v], i) =>
      expect(config[key][i]).toMatchObject({ name: n, value: v, action: 2 })
    );
  }
});
