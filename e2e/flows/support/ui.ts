import { Locator, Page, Response } from '@playwright/test';
import { expect } from './expect';

/** Building blocks for driving the admin UI the way a person does. */

/** The routed page, without the side navigation and the top bar. */
export const content = (page: Page): Locator =>
  page.locator('mat-sidenav-content').first();

/** A dotted token that looks like an untranslated transloco key. */
const RAW_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9_-]*){1,5}$/;

/** Fails when `text` is an i18n key instead of a sentence. */
export function expectRealText(text: string, what: string): void {
  const t = text.trim();
  expect(t.length, `${what} is empty`).toBeGreaterThan(0);
  expect(RAW_KEY.test(t), `${what} is a raw i18n key, not text: "${t}"`).toBe(
    false
  );
}

/** The toast at the bottom of the screen. */
export async function expectSnackbar(
  page: Page,
  matching?: RegExp | string,
  opts: { soft?: boolean } = {}
): Promise<string> {
  const bar = page.locator('mat-snack-bar-container .alert-message').last();
  await expect(bar, 'a snackbar message must appear').toBeVisible({
    timeout: 30_000,
  });
  const text = (await bar.innerText()).trim();
  const check = opts.soft ? expect.soft : expect;
  check(
    RAW_KEY.test(text),
    `snackbar message is a raw i18n key, not text: "${text}"`
  ).toBe(false);
  check(text.length, 'snackbar message is empty').toBeGreaterThan(0);
  if (matching !== undefined) {
    if (typeof matching === 'string') check(text).toContain(matching);
    else check(text).toMatch(matching);
  }
  return text;
}

/** Close the snackbar so it cannot cover a button or leak into a later step. */
export async function dismissSnackbar(page: Page): Promise<void> {
  const close = page.locator('mat-snack-bar-container button').last();
  if (await close.isVisible().catch(() => false)) {
    await close.click().catch(() => undefined);
  }
  await expect(page.locator('mat-snack-bar-container')).toHaveCount(0, {
    timeout: 30_000,
  });
}

/** Answer the app's confirm dialog. The dialog text must be real text. */
export async function confirmDialog(
  page: Page,
  answer: 'yes' | 'no' = 'yes'
): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expectRealText(
    await dialog.locator('[mat-dialog-title], h1').first().innerText(),
    'confirm dialog title'
  );
  await page
    .getByTestId(
      answer === 'yes' ? 'confirm-dialog-confirm' : 'confirm-dialog-cancel'
    )
    .click();
  await expect(dialog).toHaveCount(0);
}

/** A list page on the shared manage-table: search, paginator, open, delete. */
export class ListPage {
  constructor(
    readonly page: Page,
    /** URL fragment of the list endpoint, e.g. `/api/v2/system/role`. */
    readonly endpoint: string
  ) {}

  get table(): Locator {
    return content(this.page).locator('table[mat-table]').first();
  }
  get rows(): Locator {
    return this.table.locator('tr[mat-row]:not(.no-data-row)');
  }
  get searchBox(): Locator {
    return content(this.page).locator('.search-input input').first();
  }
  get createButton(): Locator {
    return this.page.getByTestId('manage-table-create');
  }
  get paginator(): Locator {
    return content(this.page).locator('mat-paginator').first();
  }
  get rangeLabel(): Locator {
    return this.paginator.locator('.mat-mdc-paginator-range-label');
  }
  get noDataRow(): Locator {
    return this.table.locator('tr.no-data-row');
  }

  /** A data row that contains `text` in any cell. */
  row(text: string | RegExp): Locator {
    return this.rows.filter({ hasText: text });
  }

  private isListCall(r: Response): boolean {
    const u = new URL(r.url());
    return (
      r.request().method() === 'GET' &&
      (u.pathname === this.endpoint || u.pathname === this.endpoint + '/')
    );
  }

  /** Wait until the table has left its loading state. */
  async ready(): Promise<void> {
    await expect(this.table).toBeVisible({ timeout: 60_000 });
    await expect(content(this.page).locator('.table-loading-bar')).toHaveCount(
      0,
      { timeout: 60_000 }
    );
  }

  /**
   * Type into the list's own search box and wait for the server answer (the
   * box is debounced; the filter is applied by the backend, not in the page).
   */
  async search(text: string): Promise<void> {
    const answered = this.page.waitForResponse(
      r => this.isListCall(r) && (text === '' || r.url().includes('filter=')),
      { timeout: 60_000 }
    );
    await this.searchBox.fill(text);
    const res = await answered;
    expect(res.ok(), `list search "${text}" -> HTTP ${res.status()}`).toBe(
      true
    );
    await this.ready();
  }

  nextPage(): Locator {
    return this.paginator.locator('button.mat-mdc-paginator-navigation-next');
  }
  firstPage(): Locator {
    return this.paginator.locator('button.mat-mdc-paginator-navigation-first');
  }

  /** Open a row by clicking it. */
  async open(text: string | RegExp): Promise<void> {
    const row = this.row(text);
    await expect(row, `one row must match ${text}`).toHaveCount(1);
    await row.locator('td').first().click();
  }

  /**
   * Run a row action. A list with one action shows it as an icon button; a
   * list with several puts them behind the row's "Actions" menu.
   */
  async rowAction(text: string | RegExp, action: RegExp): Promise<void> {
    const row = this.row(text);
    await expect(row, `one row must match ${text}`).toHaveCount(1);
    const menu = row.getByRole('button', { name: 'Actions', exact: true });
    if (await menu.count()) {
      await menu.click();
      // The items carry an aria-label ("Delete row 5"), so match the text
      // a person reads, not the accessible name.
      await this.page
        .getByRole('menuitem')
        .filter({ hasText: action })
        .first()
        .click();
    } else {
      await row.locator('td.df-row-actions button').first().click();
    }
  }

  /** Delete row action -> confirm dialog -> wait for the DELETE. */
  async deleteRow(text: string | RegExp): Promise<Response> {
    await this.rowAction(text, /^\s*delete\s*$/i);
    const deleted = this.page.waitForResponse(
      r =>
        r.request().method() === 'DELETE' &&
        new URL(r.url()).pathname.startsWith(this.endpoint),
      { timeout: 60_000 }
    );
    await confirmDialog(this.page, 'yes');
    const res = await deleted;
    expect(res.ok(), `DELETE -> HTTP ${res.status()}`).toBe(true);
    return res;
  }
}

/** The overlay panel of the mat-select that is open right now. */
const openPanel = (page: Page): Locator =>
  page.locator('.cdk-overlay-container .mat-mdc-select-panel').last();

/** Open a `mat-select` and return its panel. */
async function openSelect(page: Page, select: Locator): Promise<Locator> {
  const panel = openPanel(page);
  await expect(async () => {
    if (!(await panel.isVisible())) await select.click();
    await expect(panel).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  return panel;
}

/**
 * Pick an option of a plain `mat-select` by its visible text.
 * `select` is the `mat-select` element (or anything inside its form field).
 */
export async function pickOption(
  page: Page,
  select: Locator,
  option: string | RegExp,
  opts: { exact?: boolean } = {}
): Promise<void> {
  const panel = await openSelect(page, select);
  const item =
    typeof option === 'string'
      ? panel.getByRole('option', { name: option, exact: opts.exact ?? true })
      : panel.getByRole('option', { name: option });
  await item.first().click();
  // A multiple select stays open; close it so the next field is reachable.
  if (await panel.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
  }
  await expect(panel).toHaveCount(0);
}

/** Work a `mat-select multiple`, then close it. */
export async function pickOptions(
  page: Page,
  select: Locator,
  options: string[],
  toggle = false
): Promise<void> {
  const panel = await openSelect(page, select);
  for (const o of options) {
    const item = panel
      .getByRole('option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(o)}`) })
      .first();
    await expect(item, `option "${o}" must be offered`).toBeVisible();
    if (toggle || (await item.getAttribute('aria-selected')) !== 'true') {
      await item.click();
    }
  }
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
}

/**
 * The labels selected in a `mat-select multiple`, read from the open panel
 * (the closed trigger abbreviates them).
 */
export async function selectedOptions(
  page: Page,
  select: Locator
): Promise<string[]> {
  const panel = await openSelect(page, select);
  const labels = await panel
    .locator('mat-option[aria-selected="true"]')
    .evaluateAll(els =>
      els.map(el => {
        const copy = el.cloneNode(true) as HTMLElement;
        // Drop the "(+2 others)" helper some options carry.
        copy
          .querySelectorAll('.example-additional-selection')
          .forEach(n => n.remove());
        return (copy.textContent ?? '').trim();
      })
    );
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  return labels;
}

/** The text a closed `mat-select` shows for its current value. */
export async function selectedText(select: Locator): Promise<string> {
  return (
    await select.locator('.mat-mdc-select-value-text').first().innerText()
  ).trim();
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The input / textarea / select inside the form field with this label. */
export function field(scope: Page | Locator, label: string | RegExp): Locator {
  const name =
    typeof label === 'string'
      ? new RegExp(`^\\s*${escapeRegExp(label)}\\s*\\*?\\s*$`)
      : label;
  const page = 'page' in scope ? scope.page() : scope;
  return scope
    .locator('mat-form-field')
    .filter({ has: page.locator('mat-label', { hasText: name }) })
    .first()
    .locator('input, textarea, mat-select')
    .first();
}

/** A slide toggle by its label. Sets it to `on` and verifies. */
export async function setToggle(
  scope: Page | Locator,
  label: string | RegExp,
  on: boolean
): Promise<void> {
  const toggle = scope.getByRole('switch', { name: label }).first();
  await expect(toggle).toBeVisible();
  if (((await toggle.getAttribute('aria-checked')) === 'true') !== on) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('aria-checked', String(on));
}

export async function expectToggle(
  scope: Page | Locator,
  label: string | RegExp,
  on: boolean
): Promise<void> {
  await expect(
    scope.getByRole('switch', { name: label }).first()
  ).toHaveAttribute('aria-checked', String(on));
}

/** The full text of an Ace editor (not only the lines on screen). */
export async function aceValue(editor: Locator): Promise<string> {
  return editor
    .locator('.ace_editor')
    .first()
    .evaluate((el: any) => {
      const ace = (window as any).ace;
      return ace ? ace.edit(el).getValue() : (el.env?.editor?.getValue() ?? '');
    });
}

/**
 * Click a save button and wait for the write it sends. Fails when the
 * request is not a success.
 */
export async function clickAndWaitForWrite(
  page: Page,
  button: Locator,
  endpoint: string | RegExp,
  methods: string[] = ['POST', 'PUT', 'PATCH']
): Promise<Response> {
  const match = (r: Response) => {
    const path = new URL(r.url()).pathname;
    return (
      methods.includes(r.request().method()) &&
      (typeof endpoint === 'string'
        ? path.startsWith(endpoint)
        : endpoint.test(path))
    );
  };
  const written = page.waitForResponse(match, { timeout: 60_000 });
  await button.click();
  const res = await written;
  expect(
    res.ok(),
    `${res.request().method()} ${new URL(res.url()).pathname} -> HTTP ${res.status()}: ${(
      await res.text().catch(() => '')
    ).slice(0, 400)}`
  ).toBe(true);
  return res;
}
