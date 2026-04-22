import { test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * Roles CRUD.
 *
 * TODO — pending stable sidenav navigation (see event-scripts.spec.ts).
 * Intent:
 *  1. Navigate to Role Based Access → Roles
 *  2. Create a role with restricted service access
 *  3. Assign a service + verb matrix
 *  4. Save, reload, assert persisted
 *  5. Delete
 */
test.fixme('Roles: create a role with restricted service access', async ({
  page,
}) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  // TODO
});
