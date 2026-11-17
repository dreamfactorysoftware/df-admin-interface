import { Page } from '@playwright/test';
import { test, expect } from './support/test';
import { loginAsRoot } from './support/login';
import { SEED } from './support/env';
import { uniqueName } from './support/names';
import {
  expectNoWrite,
  findRowByPaging,
  loginAt,
  openRoute,
  pageHeading,
  reloadPage,
  saveButton,
  waitForRoute,
} from './support/system';
import {
  ListPage,
  aceValue,
  clickAndWaitForWrite,
  confirmDialog,
  content,
  dismissSnackbar,
  expectSnackbar,
  expectToggle,
  field,
  pickOption,
  selectedText,
  setToggle,
} from './support/ui';

/**
 * Scheduler tasks: a stored API request run every N minutes. The gate stack
 * keeps cron off, so nothing these tests create ever runs.
 */
test.describe.configure({ timeout: 480_000 });
// A missing element fails after a minute, not at the test timeout.
test.use({ actionTimeout: 60_000 });

const LIST = '/system-settings/scheduler';
const ENDPOINT = '/api/v2/system/scheduler';
const WRITES = /^\/api\/v2\/system\/scheduler/;

const form = (page: Page) => {
  const c = content(page);
  return {
    name: field(c, 'Name'),
    description: field(c, 'Description'),
    service: field(c, 'Service'),
    component: field(c, 'Component'),
    frequency: field(c, /^\s*Frequency/),
    runAsApp: field(c, /^\s*Run as app/),
    runAsUser: field(c, /^\s*Run as user/),
    payload: field(c, /^\s*Payload/),
    method: field(c, 'Method'),
    active: /^\s*active\s*$/i,
    save: saveButton(page),
  };
};

/** Pick a service, wait for its component list, pick a component. */
async function pickServiceAndComponent(
  page: Page,
  service: string,
  component: string
): Promise<void> {
  const f = form(page);
  const accessList = page.waitForResponse(
    r =>
      new URL(r.url()).pathname === `/api/v2/${service}` &&
      r.url().includes('as_access_list'),
    { timeout: 30_000 }
  );
  await pickOption(page, f.service, service);
  expect((await accessList).ok(), 'the component list of the service').toBe(
    true
  );
  await expect(
    f.component,
    'the Component picker appears once the service is chosen'
  ).toBeVisible();
  await pickOption(page, f.component, component);
}

test('scheduler round trip: create with every field, reopen, reload, edit, delete', async ({
  page,
  api,
  watch,
}) => {
  const name = uniqueName('task');
  const description = `Flow suite task ${name}: nightly customer sync`;
  const payload = '{"resource":[],"note":"flow suite"}';
  const app = await api.findByName('app', `${SEED.appPrefix}01`);
  expect(app, 'seeded app gate_app_01').not.toBeNull();
  const user = (
    await api.list('user', {
      filter: `email="${SEED.userPrefix}01@gate.test"`,
    })
  )[0];
  expect(user, 'seeded user gate_user_01').toBeTruthy();

  await loginAsRoot(page);
  const list = new ListPage(page, ENDPOINT);

  await test.step('open the create form from the list', async () => {
    await openRoute(page, LIST);
    await list.ready();
    await list.createButton.click();
    await waitForRoute(page, `${LIST}/create`);
    await expect(pageHeading(page)).toHaveText(/create scheduler/i);
  });

  await test.step('fill every field', async () => {
    const f = form(page);
    await f.name.fill(name);
    await f.description.fill(description);
    // Inactive: the task must never run, and the toggle gets exercised.
    await setToggle(content(page), f.active, false);
    await pickServiceAndComponent(
      page,
      SEED.sampleDbService,
      '_table/customers/*'
    );
    await f.frequency.fill('45');
    await expect(f.payload, 'a GET task has no payload field').toHaveCount(0);
    await pickOption(page, f.method, /^\s*POST/);
    await expect(
      f.payload,
      'choosing POST adds the payload field'
    ).toBeVisible();
    await f.payload.fill(payload);
    await pickOption(page, f.runAsApp, app.name);
    await expect(
      f.runAsUser,
      'choosing an app offers "run as user"'
    ).toBeVisible();
    await pickOption(page, f.runAsUser, new RegExp(user.email));
  });

  await test.step('save: success message, back on the list', async () => {
    api.track('scheduler', name);
    const res = await clickAndWaitForWrite(page, form(page).save, ENDPOINT, [
      'POST',
    ]);
    expect(res.status()).toBeLessThan(300);
    await expectSnackbar(page, /schedul|task|creat/i);
    await waitForRoute(page, LIST);
    await dismissSnackbar(page);
  });

  let id = 0;
  await test.step('the API has the record exactly as typed', async () => {
    const rec = await api.findByName('scheduler', name);
    expect(rec, 'the task exists once').not.toBeNull();
    id = rec.id;
    expect(rec).toMatchObject({
      name,
      description,
      is_active: false,
      component: '_table/customers/*',
      verb: 'POST',
      verb_mask: 2,
      frequency: 45,
      app_id: app.id,
      user_id: user.id,
    });
    expect(JSON.parse(rec.payload)).toEqual(JSON.parse(payload));
    const sample = (await api.findByName('service', SEED.sampleDbService))!;
    expect(rec.service_id).toBe(sample.id);
  });

  const expectFormShowsCreated = async () => {
    const f = form(page);
    await expect(f.name).toHaveValue(name);
    await expect(f.description).toHaveValue(description);
    await expectToggle(content(page), f.active, false);
    expect(await selectedText(f.service)).toBe(SEED.sampleDbService);
    await expect(
      f.component,
      'the saved component is shown in the Component picker'
    ).toContainText('_table/customers/*');
    await expect(f.frequency).toHaveValue('45');
    await expect(f.method).toContainText(/POST/);
    await expect(f.payload).toBeVisible();
    expect(JSON.parse(await f.payload.inputValue())).toEqual(
      JSON.parse(payload)
    );
    await expect(f.runAsApp).toContainText(app.name);
    await expect(f.runAsUser).toContainText(user.email);
  };

  await test.step('open it from the list: every field shows what was saved', async () => {
    await findRowByPaging(list, name);
    await list.open(name);
    await waitForRoute(page, `${LIST}/${id}`);
    await expect(pageHeading(page)).toHaveText(name);
    await expectFormShowsCreated();
  });

  const newDescription = `${description} (edited)`;
  await test.step('edit: description, frequency, GET (payload goes away), active', async () => {
    const f = form(page);
    await f.description.fill(newDescription);
    await f.frequency.fill('120');
    await pickOption(page, f.method, /^\s*GET/);
    await expect(f.payload, 'a GET task has no payload field').toHaveCount(0);
    await pickOption(page, f.component, '_table/regions/');
    await pickOption(page, f.runAsApp, /none/i);
    await expect(
      f.runAsUser,
      'without an app there is no "run as user"'
    ).toHaveCount(0);
    await setToggle(content(page), f.active, true);
    const res = await clickAndWaitForWrite(page, f.save, `${ENDPOINT}/${id}`, [
      'PUT',
      'PATCH',
    ]);
    expect(res.status()).toBeLessThan(300);
    await expectSnackbar(page, /schedul|task|updat/i);
    await waitForRoute(page, LIST);
    await dismissSnackbar(page);
  });

  await test.step('the edit is stored and shown', async () => {
    const rec = await api.get('scheduler', id);
    expect(rec).toMatchObject({
      name,
      description: newDescription,
      is_active: true,
      component: '_table/regions/',
      verb: 'GET',
      verb_mask: 1,
      frequency: 120,
      app_id: null,
      user_id: null,
    });
    expect(rec.payload ?? null, 'a GET task stores no payload').toBeNull();
    await findRowByPaging(list, name);
    await list.open(name);
    await waitForRoute(page, `${LIST}/${id}`);
    await reloadPage(page);
    const f = form(page);
    await expect(f.description).toHaveValue(newDescription);
    await expect(f.frequency).toHaveValue('120');
    await expect(f.method).toContainText(/GET/);
    await expectToggle(content(page), f.active, true);
    await expect(f.component).toContainText('_table/regions/');
  });

  await test.step('delete from the list: "No" keeps it, "Yes" removes it', async () => {
    await openRoute(page, LIST);
    await findRowByPaging(list, name);
    const mark = watch.writes.length;
    await list.rowAction(name, /delete/i);
    await confirmDialog(page, 'no');
    await expectNoWrite(page, watch, mark, WRITES, 'answering "No"');
    await expect(list.row(name)).toHaveCount(1);
    expect(await api.findByName('scheduler', name)).not.toBeNull();

    await list.deleteRow(name);
    await expect(list.row(name)).toHaveCount(0);
    expect(await api.findByName('scheduler', name)).toBeNull();
  });
});

test('scheduler validation: nothing is sent while the form is incomplete', async ({
  page,
  watch,
}) => {
  await loginAt(page, `${LIST}/create`);
  const f = form(page);

  await test.step('empty form', async () => {
    const mark = watch.writes.length;
    await f.save.click();
    await expectNoWrite(page, watch, mark, WRITES, 'saving an empty form');
    await waitForRoute(page, `${LIST}/create`);
  });

  await test.step('a name, but no service and no component', async () => {
    await f.name.fill(uniqueName('task'));
    const mark = watch.writes.length;
    await f.save.click();
    await expectNoWrite(page, watch, mark, WRITES, 'saving without a service');
    await waitForRoute(page, `${LIST}/create`);
  });

  await test.step('a service, but no component', async () => {
    await pickOption(page, f.service, SEED.sampleDbService);
    await expect(f.component).toBeVisible();
    const mark = watch.writes.length;
    await f.save.click();
    await expectNoWrite(
      page,
      watch,
      mark,
      WRITES,
      'saving without a component'
    );
    await waitForRoute(page, `${LIST}/create`);
  });

  await test.step('a payload that is not JSON', async () => {
    await pickOption(page, f.component, '_table/regions/');
    await pickOption(page, f.method, /^\s*POST/);
    await f.payload.fill('{ this is not json');
    const mark = watch.writes.length;
    await f.save.click();
    await expectNoWrite(page, watch, mark, WRITES, 'saving a broken payload');
    await waitForRoute(page, `${LIST}/create`);
  });
});

test('scheduler: the Log tab shows the last result of a failing task', async ({
  page,
  api,
}) => {
  // Seeded: gate_task_03 points at a table that does not exist.
  const task = (
    await api.list('scheduler', {
      filter: 'name like "gate_task_03%"',
      related: 'task_log_by_task_id',
    })
  )[0];
  expect(task?.task_log_by_task_id, 'gate_task_03 has a log row').toBeTruthy();
  const log = task.task_log_by_task_id;

  await loginAt(page, LIST);
  const list = new ListPage(page, ENDPOINT);
  const row = await findRowByPaging(list, task.name);
  await expect(
    row.locator('fa-icon.log-warning'),
    'a task with a log shows the warning icon in the Log column'
  ).toBeVisible();
  const quiet = await findRowByPaging(list, /gate_task_05/);
  await expect(quiet.locator('fa-icon.log-warning')).toHaveCount(0);

  await (await findRowByPaging(list, task.name)).locator('td').nth(2).click();
  await waitForRoute(page, `${LIST}/${task.id}`);
  await content(page).getByRole('tab', { name: 'Log' }).click();
  const panel = content(page).getByRole('tabpanel', { name: 'Log' });
  await expect(panel).toContainText(String(log.status_code));
  await expect
    .poll(() => aceValue(panel.locator('df-ace-editor')))
    .toBe(log.content);

  // The log is read-only: typing does not change it.
  await panel.locator('.ace_content').click();
  await page.keyboard.type('x');
  expect(await aceValue(panel.locator('df-ace-editor'))).toBe(log.content);

  await panel.getByRole('button', { name: /go back/i }).click();
  await waitForRoute(page, LIST);
});
