import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAsAdmin } from './fixtures/admin-login';

/**
 * df-scheduler#41: the task list shows a "Last run" column and the edit view
 * has a "Run history" tab. A task that has never run reads "Never" and the
 * tab explains when to expect the first run.
 */
test('Scheduler: Last run column and Run history tab for a never-run task', async ({
  page,
}) => {
  const login = await page.request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const headers = {
    'X-DreamFactory-Session-Token': (await login.json()).session_token,
  };
  const name = `e2e_runs_${Date.now()}`;
  const svc = await page.request.get(
    '/api/v2/system/service?filter=name%3Dsystem&fields=id',
    { headers }
  );
  const serviceId = (await svc.json()).resource[0].id;
  const created = await page.request.post('/api/v2/system/scheduler', {
    headers,
    data: {
      resource: [
        { name, service_id: serviceId, component: 'admin', verb_mask: 1, frequency: 5, is_active: false },
      ],
    },
  });
  expect(created.ok(), await created.text()).toBe(true);
  const id = (await created.json()).resource[0].id;

  try {
    await loginAsAdmin(page);
    await page.goto('/dreamfactory/dist/#/system-settings/scheduler');
    await expect(
      page.getByRole('columnheader', { name: 'Last run' })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('row').filter({ hasText: name }).getByText('Never')
    ).toBeVisible();

    await page.goto(`/dreamfactory/dist/#/system-settings/scheduler/${id}`);
    await page.getByRole('tab', { name: 'Run history' }).click();
    await expect(page.getByText('This task has not run yet')).toBeVisible();
  } finally {
    await page.request.delete(`/api/v2/system/scheduler/${id}`, { headers });
  }
});
