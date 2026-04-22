import { test } from '@playwright/test';
import { loginAsAdmin, waitForAppReady } from './fixtures/admin-login';

/**
 * API connection (database) CRUD.
 *
 * TODO — flesh out once the sidenav navigation pattern is stable
 * (see the TODO in event-scripts.spec.ts). Intent:
 *  1. Navigate to API Connections → Database
 *  2. Click +, pick "SQL Server" or "SQLite"
 *  3. Fill out the minimum config fields, save
 *  4. Assert the service appears in the list
 *  5. Click the row, edit label, save
 *  6. Delete, assert it's gone
 */
test.fixme('API Connections: create → edit → delete a database service', async ({
  page,
}) => {
  await loginAsAdmin(page);
  await waitForAppReady(page);
  // TODO
});
