import { test, expect, APIRequestContext, Page } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsAdmin,
  waitForAppReady,
} from './fixtures/admin-login';

/**
 * Role access rows: removing a row and saving. A row added then removed
 * before saving used to crash onSubmit (`access.reduce is not a function`),
 * so Update did nothing. The trash button also submitted the form.
 */

// Login + role load + save is ~30s against a cold instance.
test.describe.configure({ timeout: 90_000 });

const ROW = 'tr:has(mat-select[formcontrolname="service"])';

async function seedRole(request: APIRequestContext) {
  const auth = await request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const headers = {
    'X-DreamFactory-Session-Token': (await auth.json()).session_token,
  };
  const access = (component: string) => ({
    service_id: null,
    component,
    verb_mask: 1,
    requestor_mask: 1,
  });
  const res = await request.post('/api/v2/system/role', {
    headers,
    data: {
      resource: [
        {
          name: `e2e-role-remove-${Date.now()}`,
          is_active: true,
          role_service_access_by_role_id: [access('*'), access('_table/*')],
        },
      ],
    },
  });
  expect(res.ok(), await res.text()).toBe(true);
  const id: number = (await res.json()).resource[0].id;
  const accessRows = async () =>
    (
      await (
        await request.get(
          `/api/v2/system/role/${id}?related=role_service_access_by_role_id`,
          { headers }
        )
      ).json()
    ).role_service_access_by_role_id;
  const cleanup = () =>
    request.delete(`/api/v2/system/role/${id}`, { headers });
  return { id, accessRows, cleanup };
}

async function openRole(page: Page, id: number) {
  const pageErrors: string[] = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  const writes: string[] = [];
  page.on('request', r => {
    if (r.url().includes('/system/role') && r.method() !== 'GET')
      writes.push(r.method());
  });
  await loginAsAdmin(page);
  await waitForAppReady(page);
  await page.goto(
    `/dreamfactory/dist/#/api-connections/role-based-access/${id}`
  );
  await expect(page.locator(ROW)).toHaveCount(2, { timeout: 15_000 });
  return { pageErrors, writes };
}

const trash = (page: Page) =>
  page.locator(ROW).last().locator('td:last-child button');

async function save(page: Page) {
  const saved = page.waitForResponse(
    r =>
      r.url().includes('/system/role') &&
      ['PUT', 'PATCH'].includes(r.request().method()),
    { timeout: 10_000 }
  );
  await page.getByRole('button', { name: /^(update|save)$/i }).click();
  expect((await saved).ok()).toBe(true);
  await page.waitForURL(url => !/role-based-access\/\d+/.test(url.toString()));
}

test('Roles: save after adding then removing an access row', async ({
  page,
  request,
}) => {
  const role = await seedRole(request);
  try {
    const { pageErrors, writes } = await openRole(page, role.id);
    const rows = page.locator(ROW);

    await page
      .getByRole('button', { name: /new entry/i })
      .first()
      .click();
    await expect(rows).toHaveCount(3);
    await trash(page).click();
    await expect(rows).toHaveCount(2);
    expect(writes, 'removing a row must not save the role').toEqual([]);

    await save(page);
    expect(pageErrors).toEqual([]);
    expect(await role.accessRows()).toHaveLength(2);
  } finally {
    await role.cleanup();
  }
});

test('Roles: removing a saved access row deletes it on save', async ({
  page,
  request,
}) => {
  const role = await seedRole(request);
  try {
    const { pageErrors, writes } = await openRole(page, role.id);
    const rows = page.locator(ROW);

    await trash(page).click();
    await expect(rows).toHaveCount(1);
    expect(writes, 'removing a row must not save the role').toEqual([]);

    await save(page);
    expect(pageErrors).toEqual([]);
    expect(await role.accessRows()).toHaveLength(1);
  } finally {
    await role.cleanup();
  }
});
