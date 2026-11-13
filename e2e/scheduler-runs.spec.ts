import { test, expect } from '@playwright/test';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  loginAsAdmin,
} from './fixtures/admin-login';

/**
 * df-scheduler#41: the task list shows a "Last run" column and the edit view
 * has a "Run history" tab. A task that has never run reads "Never" and the
 * tab explains when to expect the first run.
 *
 * Per-run history is an optional backend feature (df-scheduler with the
 * task_run table). The admin UI ships separately and hides the column and
 * the tab on a backend without it, so this test probes the backend first and
 * skips there. It never fails because the backend is older.
 */
test('Scheduler: Last run column and Run history tab for a never-run task', async ({
  page,
}) => {
  const login = await page.request.post('/api/v2/system/admin/session', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(login.ok(), `admin API login HTTP ${login.status()}`).toBe(true);
  const headers = {
    'X-DreamFactory-Session-Token': (await login.json()).session_token,
  };

  // The scheduler is a licensed system resource. Same check the UI paywall
  // makes: is it in the instance's system resource list at all?
  const system = await page.request.get('/api/v2/system', { headers });
  expect(system.ok(), `GET /api/v2/system HTTP ${system.status()}`).toBe(true);
  const resources: Array<{ name: string }> =
    (await system.json()).resource ?? [];
  test.skip(
    !resources.some(r => r.name === 'scheduler'),
    'Skipped: this instance has no system/scheduler resource (not licensed or df-scheduler not installed).'
  );

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
        {
          name,
          service_id: serviceId,
          component: 'admin',
          verb_mask: 1,
          frequency: 5,
          is_active: false,
        },
      ],
    },
  });
  expect(created.ok(), await created.text()).toBe(true);
  const id = (await created.json()).resource[0].id;

  try {
    // Feature probe. An older df-scheduler answers 400 "Unknown
    // relationship" here. The relation is only resolved for an existing row,
    // which is why the probe runs after the task is created. test.skip()
    // throws, so the finally block below still deletes the task.
    const probe = await page.request.get(
      `/api/v2/system/scheduler/${id}?related=task_run_by_task_id`,
      { headers }
    );
    const probeBody = await probe.text();
    test.skip(
      probe.status() === 400 && /unknown relationship/i.test(probeBody),
      'Skipped: this backend has no per-run history. Its df-scheduler lacks the task_run_by_task_id relation (df-scheduler#41), so the UI hides the Last run column and the Run history tab.'
    );
    // Anything else that is not a success is a real failure, not a skip.
    expect(probe.ok(), `run history probe: ${probeBody}`).toBe(true);
    const task = JSON.parse(probeBody);
    // run_status is the signal the UI keys the column and the tab on.
    expect(task.run_status).toEqual({
      is_running: false,
      last_run: null,
      last_success: null,
      last_failure: null,
    });
    expect(task.task_run_by_task_id).toEqual([]);

    const runRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('task_run_by_task_id'))
        runRequests.push(req.url());
    });

    await loginAsAdmin(page);
    await page.goto('/dreamfactory/dist/#/system-settings/scheduler');
    await expect(
      page.getByRole('columnheader', { name: 'Last run' })
    ).toBeVisible({ timeout: 15_000 });
    // The scheduler list has no search box and shows 10 rows a page, so on an
    // instance that already has tasks the new one sits on a later page.
    const row = page.getByRole('row').filter({ hasText: name });
    const next = page.getByRole('button', { name: 'Next page' });
    for (let i = 0; i < 20 && !(await row.isVisible()); i++) {
      if (!(await next.isEnabled())) break;
      await next.click();
      await page.waitForLoadState('networkidle');
    }
    await expect(row.getByText('Never')).toBeVisible();

    await page.goto(`/dreamfactory/dist/#/system-settings/scheduler/${id}`);
    const tab = page.getByRole('tab', { name: 'Run history' });
    await expect(tab).toBeVisible({ timeout: 15_000 });
    // The edit form is usable before, and without, any run history request.
    await expect(page.locator('input[formcontrolname="name"]')).toHaveValue(
      name
    );
    expect(runRequests, 'runs must load only when the tab opens').toEqual([]);

    const runsLoaded = page.waitForResponse(
      r => r.url().includes('related=task_run_by_task_id') && r.ok()
    );
    await tab.click();
    await runsLoaded;
    await expect(page.getByText('This task has not run yet')).toBeVisible();
    await expect(page.getByText('Last success: None')).toBeVisible();
    expect(runRequests.length).toBe(1);
  } finally {
    await page.request.delete(`/api/v2/system/scheduler/${id}`, { headers });
  }
});
