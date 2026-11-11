import { Locator, Page, Response } from '@playwright/test';
import { expect } from './expect';
import { FlowApi } from './api';
import { Watcher } from './watch';
import { openRoute } from './system';
import { content, escapeRegExp, pickOption, setToggle } from './ui';

/**
 * Helpers for the generic service form (`df-service-details`): one template
 * that renders every service type from the backend's config schema.
 */

export const SERVICE_ENDPOINT = '/api/v2/system/service';

/** Hash route of the list page behind each service group. */
export const SERVICE_LISTS = {
  network: '/api-connections/api-types/network',
  mcp: '/ai/mcp',
} as const;

/**
 * The Service Definition editor of the HTTP and SOAP forms asks Ace for a
 * syntax mode named after the service type (`mode-rws.js`, `mode-soap.js`),
 * which does not exist.
 */
export function allowAceModeDefect(watch: Watcher): void {
  watch.allowHttp({
    status: 404,
    method: 'GET',
    url: /\/assets\/ace-builds\/mode-(rws|soap)\.js$/,
    reason: 'df-admin-interface#581: Ace mode named after the service type',
    optional: true,
  });
}

/** The gate backend is shared; a list or a save can be slow under load. */
const SLOW = 180_000;

export const serviceForm = (page: Page) => {
  const c = content(page);
  return {
    type: c.locator('mat-select[formcontrolname="type"]').first(),
    name: c.locator('input[formcontrolname="name"]').first(),
    label: c.locator('input[formcontrolname="label"]').first(),
    description: c.locator('textarea[formcontrolname="description"]').first(),
    active: c.locator('mat-slide-toggle[formcontrolname="isActive"]').first(),
    save: c.getByRole('button', { name: /^\s*save\s*$/i }),
    cancel: c.getByRole('button', { name: /^\s*cancel\s*$/i }),
  };
};

/** Choose the service type on a create form that is already open. */
async function chooseType(page: Page, typeLabel: string): Promise<void> {
  const f = serviceForm(page);
  await expect(f.type, 'the service type picker must render').toBeVisible({
    timeout: SLOW,
  });
  await pickOption(page, f.type, typeLabel);
  await expect(f.type).toContainText(typeLabel);
  await expect(f.name).toBeVisible();
}

/** Load the create form of a service group and choose the type by its label. */
export async function openCreateForm(
  page: Page,
  listRoute: string,
  typeLabel: string
): Promise<void> {
  await openRoute(page, `${listRoute}/create`);
  await chooseType(page, typeLabel);
}

interface BaseValues {
  name: string;
  label: string;
  description: string;
  active: boolean;
}

export async function fillBase(page: Page, v: BaseValues): Promise<void> {
  const f = serviceForm(page);
  await f.name.fill(v.name);
  await f.label.fill(v.label);
  await f.description.fill(v.description);
  // Scoped to the Active toggle, so any accessible name will do.
  await setToggle(f.active, /.*/, v.active);
}

/** Open every collapsed options panel of the form (Advanced Options, Options). */
export async function expandOptions(page: Page): Promise<void> {
  // Only the form's own top-level panels: nested ones (Link to Service) stay
  // as the user finds them.
  const headers = content(page)
    .locator('form.details-section > mat-accordion mat-expansion-panel-header')
    .filter({ hasText: /options/i });
  const n = await headers.count();
  for (let i = 0; i < n; i++) {
    const header = headers.nth(i);
    if ((await header.getAttribute('aria-expanded')) !== 'true') {
      await header.click();
    }
    await expect(header).toHaveAttribute('aria-expanded', 'true');
  }
}

/** The form field around a control is in its error state (red outline). */
export async function expectFieldInvalid(
  control: Locator,
  what: string
): Promise<void> {
  await expect(
    control.locator('xpath=ancestor::mat-form-field[1]'),
    what
  ).toHaveClass(/mat-form-field-invalid/);
}

const exact = (label: string) =>
  new RegExp(`^\\s*${escapeRegExp(label)}\\s*\\*?\\s*$`);

/** The table of an array field, by its label. */
export function arrayField(page: Page, label: string): Locator {
  return content(page)
    .locator('df-array-field')
    .filter({
      has: page
        .locator('mat-card-header, th[mat-header-cell]')
        .filter({ hasText: exact(label) }),
    })
    .first();
}

export const arrayRows = (field: Locator): Locator =>
  field.locator('tr[mat-row]');

const isServiceWrite = (methods: string[]) => (r: Response) =>
  methods.includes(r.request().method()) &&
  new URL(r.url()).pathname.startsWith(SERVICE_ENDPOINT);

/**
 * Click Save on the create form. Tracks the name for cleanup first, waits
 * for the POST, checks it succeeded and returns the new id.
 */
export async function saveNewService(
  page: Page,
  api: FlowApi,
  name: string
): Promise<number> {
  api.track('service', name);
  const posted = page.waitForResponse(isServiceWrite(['POST']), {
    timeout: SLOW,
  });
  await serviceForm(page).save.click();
  const res = await posted;
  expect(
    res.ok(),
    `POST system/service -> HTTP ${res.status()}: ${(
      await res.text().catch(() => '')
    ).slice(0, 400)}`
  ).toBe(true);
  const body = await res.json();
  const id = body?.resource?.[0]?.id ?? body?.id;
  expect(id, 'the create response carries the new id').toBeTruthy();
  return id as number;
}
