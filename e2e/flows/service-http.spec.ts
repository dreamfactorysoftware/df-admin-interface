import { test, expect } from './support/test';
import { loginAsRoot } from './support/login';
import { uniqueName } from './support/names';
import {
  allowAceModeDefect,
  arrayField,
  arrayRows,
  ConfigField,
  expandOptions,
  expectConfigShown,
  expectConfigStored,
  expectFieldInvalid,
  fillBase,
  openCreateForm,
  saveNewService,
  SERVICE_LISTS,
  serviceForm,
} from './support/services';
import { routeOf } from './support/system';

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

const POST = 'POST (create)';

test('HTTP service: an empty form is not sent, the missing name is marked', async ({
  page,
  watch,
}) => {
  await loginAsRoot(page);
  await openCreateForm(page, LIST, TYPE);
  const f = serviceForm(page);
  await f.save.click();
  await expectFieldInvalid(
    f.name,
    'the required Namespace field is marked invalid'
  );
  expect(routeOf(new URL(page.url()))).toBe(`${LIST}/create`);
  expect(
    watch.writesTo(/\/api\/v2\/system\/service/),
    'no create request may be sent for an empty form'
  ).toEqual([]);
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

  const imported: ConfigField[] = [
    {
      kind: 'text',
      label: BASE_URL_LABEL,
      api: 'base_url',
      value: 'https://api.example.com/v2/orders',
    },
    {
      kind: 'rows',
      label: 'Parameters',
      api: 'parameters',
      rows: [
        ['limit', '25', false, true, false, [POST]],
        ['status', 'open', false, true, false, [POST]],
      ],
      stored: [
        { name: 'limit', value: '25', outbound: true, action: 2 },
        { name: 'status', value: 'open', outbound: true, action: 2 },
      ],
    },
    {
      kind: 'rows',
      label: 'Headers',
      api: 'headers',
      rows: [
        ['Authorization', 'Bearer flow-suite-token', false, [POST]],
        ['Accept', 'application/json', false, [POST]],
      ],
      stored: [
        { name: 'Authorization', value: 'Bearer flow-suite-token', action: 2 },
        { name: 'Accept', value: 'application/json', action: 2 },
      ],
    },
  ];
  await expectConfigShown(page, [imported[0]]);
  await expandOptions(page);
  await expectConfigShown(page, imported.slice(1));
  await expect(arrayRows(arrayField(page, 'CURL Options'))).toHaveCount(0);

  const id = await saveNewService(page, api, name);
  const rec = await api.get('service', id);
  expectConfigStored(rec.config, imported);
});
