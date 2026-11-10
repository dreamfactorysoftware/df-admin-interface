import { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { FlowApi } from './support/api';
import { uniqueName } from './support/names';
import {
  cancelButton,
  expectNoWrite,
  loginAt,
  pageHeading,
  reloadPage,
  saveButton,
  waitForRoute,
  writesSince,
} from './support/system';
import {
  ListPage,
  clickAndWaitForWrite,
  confirmDialog,
  content,
  dismissSnackbar,
  expectRealText,
  expectSnackbar,
  field,
} from './support/ui';

/**
 * Email templates: edit round trip, validation, list search and delete.
 * Create is not covered: on develop the create page throws in `ngOnInit`
 * (fixed by `fix/email-template-create-crash`); add a create test with it.
 */
test.describe.configure({ timeout: 480_000 });
// A missing element fails after a minute, not at the test timeout.
test.use({ actionTimeout: 60_000 });

const LIST = '/system-settings/config/email-templates';
const ENDPOINT = '/api/v2/system/email_template';
const WRITES = /^\/api\/v2\/system\/email_template/;

/** Form label of each stored field, by its API name. */
const FIELDS: Record<string, string> = {
  name: 'Template Name',
  description: 'Template Description',
  to: 'Recipient',
  cc: 'CC',
  bcc: 'BCC',
  subject: 'Subject',
  attachment: 'Attachment',
  body_html: 'Body',
  from_name: 'Sender Name',
  from_email: 'Sender Email',
  reply_to_name: 'Reply To Name',
  reply_to_email: 'Reply To Email',
};
type Template = Record<string, string>;

const input = (page: Page, key: string) => field(content(page), FIELDS[key]);

const values = (name: string, tag: string): Template => ({
  name,
  description: `Flow suite template ${tag}: order confirmation`,
  to: `customer-${tag}@e2e.test`,
  cc: `ops-${tag}@e2e.test`,
  bcc: `audit-${tag}@e2e.test`,
  subject: `[${tag}] Your order {order_id} has shipped, {first_name}`,
  attachment: `invoices/${tag}.pdf`,
  body_html: `<p>Hello {first_name},</p>\n<p>Order {order_id} is on its way (${tag}).</p>`,
  from_name: `Flow Mailer ${tag}`,
  from_email: `no-reply-${tag}@e2e.test`,
  reply_to_name: `Flow Support ${tag}`,
  reply_to_email: `support-${tag}@e2e.test`,
});

async function fillForm(page: Page, v: Template): Promise<void> {
  for (const k of Object.keys(FIELDS)) await input(page, k).fill(v[k]);
}

async function expectForm(page: Page, v: Template): Promise<void> {
  for (const k of Object.keys(FIELDS)) {
    await expect(input(page, k), FIELDS[k]).toHaveValue(v[k]);
  }
}

async function seedTemplate(api: FlowApi) {
  const name = uniqueName('template');
  const v = values(name, 'seed');
  const rec = await api.create('email_template', {
    ...v,
    body_text: 'Plain text body kept for mail clients without HTML.',
  });
  return { id: rec.id as number, name, v };
}

test('email template edit: every field, reload, API read-back, plain-text body kept', async ({
  page,
  api,
}) => {
  const seeded = await seedTemplate(api);
  const edited = values(seeded.name, 'edited');

  await loginAt(page, LIST);
  const list = new ListPage(page, ENDPOINT);

  await test.step('find by search, open: the form shows the stored values', async () => {
    await list.search(seeded.name);
    await expect(list.rows).toHaveCount(1);
    await list.open(seeded.name);
    await waitForRoute(page, `${LIST}/${seeded.id}`);
    await expect(pageHeading(page)).toHaveText(seeded.name);
    await expectForm(page, seeded.v);
  });

  await test.step('change every field, Update: success message, back on the list', async () => {
    await fillForm(page, edited);
    const res = await clickAndWaitForWrite(
      page,
      saveButton(page),
      `${ENDPOINT}/${seeded.id}`,
      ['PUT', 'PATCH']
    );
    expect(res.status()).toBeLessThan(300);
    await expectSnackbar(page, /email template updated/i);
    await waitForRoute(page, LIST);
    await dismissSnackbar(page);
  });

  await test.step('the API has the edit; the plain-text body was not wiped', async () => {
    const rec = await api.get('email_template', seeded.id);
    expect(rec).toMatchObject(edited);
    expect(
      rec.body_text,
      'body_text is not on the form; an edit must leave it alone'
    ).toBe('Plain text body kept for mail clients without HTML.');
  });

  await test.step('reopen and reload: the edit is shown', async () => {
    await list.search(seeded.name);
    await expect(list.row(seeded.name)).toContainText(edited.description);
    await list.open(seeded.name);
    await waitForRoute(page, `${LIST}/${seeded.id}`);
    await expectForm(page, edited);
    await reloadPage(page);
    await expectForm(page, edited);
  });
});

test('email template edit: an empty name blocks Update; Cancel discards', async ({
  page,
  api,
  watch,
}) => {
  const seeded = await seedTemplate(api);
  await loginAt(page, `${LIST}/${seeded.id}`);
  const name = input(page, 'name');
  await expect(name).toHaveValue(seeded.name);

  await name.fill('');
  let mark = watch.writes.length;
  await saveButton(page).click();
  await expectNoWrite(page, watch, mark, WRITES, 'updating without a name');
  await waitForRoute(page, `${LIST}/${seeded.id}`);
  const error = content(page).locator('mat-error').first();
  await expect(error).toBeVisible();
  expectRealText(await error.innerText(), 'name error');

  await name.fill(seeded.name);
  await input(page, 'subject').fill('this edit is thrown away');
  mark = watch.writes.length;
  await cancelButton(page).click();
  await waitForRoute(page, LIST);
  expect(writesSince(watch, mark, WRITES)).toEqual([]);
  expect((await api.get('email_template', seeded.id)).subject).toBe(
    seeded.v.subject
  );
});

test('email template list: search by name and description, empty state, delete', async ({
  page,
  api,
  watch,
}) => {
  const a = await seedTemplate(api);
  const b = await seedTemplate(api);

  await loginAt(page, LIST);
  const list = new ListPage(page, ENDPOINT);
  await list.ready();

  await test.step('search by name narrows to the record', async () => {
    await list.search(a.name);
    await expect(list.rows).toHaveCount(1);
    await expect(list.row(a.name)).toBeVisible();
  });

  await test.step('search by a word of the description finds both', async () => {
    // Both seeded templates share the run id in their names; the description
    // search is exercised with the shared phrase.
    await list.search('Flow suite template seed');
    await expect(list.row(a.name)).toHaveCount(1);
    await expect(list.row(b.name)).toHaveCount(1);
  });

  await test.step('a search with no match shows the empty state; Clear restores', async () => {
    await list.search('e2e_no_such_template_zzz');
    await expect(list.rows).toHaveCount(0);
    await expect(list.noDataRow).toBeVisible();
    expectRealText(
      (await list.noDataRow.innerText()).split('\n')[0],
      'empty state text'
    );
    await list.noDataRow.getByRole('button').click();
    await expect(list.searchBox).toHaveValue('');
    await expect(list.rows.first()).toBeVisible();
  });

  await test.step('delete: "No" keeps the record, "Yes" removes it', async () => {
    await list.search(a.name);
    const mark = watch.writes.length;
    await list.rowAction(a.name, /delete/i);
    await confirmDialog(page, 'no');
    await expectNoWrite(page, watch, mark, WRITES, 'answering "No"');
    expect(await api.findByName('email_template', a.name)).not.toBeNull();

    await list.deleteRow(a.name);
    await expect(list.row(a.name)).toHaveCount(0);
    expect(await api.findByName('email_template', a.name)).toBeNull();
    expect(
      await api.findByName('email_template', b.name),
      'the other template is untouched'
    ).not.toBeNull();
  });
});
