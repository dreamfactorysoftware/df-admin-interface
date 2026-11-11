import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { PickerItem } from 'src/app/shared/components/df-picker-list/df-picker-list.component';
import {
  AiBudgetsAvailability,
  AiBudgetsAvailabilityService,
} from './ai-budgets-availability.service';
import { Budget, BudgetList, BudgetsService } from './budgets.service';
import {
  BUDGET_PAGE_SIZE,
  DfAiBudgetsComponent,
  capText,
  spentText,
  usedText,
} from './df-ai-budgets.component';

// Real copy, so a missing translation key fails the spec.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

function budget(over: Partial<Budget> = {}): Budget {
  return {
    id: 1,
    label: 'Sales monthly',
    dimension_type: 'role',
    dimension_id: 7,
    dimension_name: 'sales',
    period: 'monthly',
    budget_usd: 50,
    hard_stop: false,
    is_active: true,
    alert_webhook_url: null,
    has_alert_webhook_auth: false,
    spent_usd: 12.5,
    remaining_usd: 37.5,
    utilization: 0.25,
    blocking: false,
    ...over,
  };
}

function budgets(n: number): Budget[] {
  return Array.from({ length: n }, (_, i) =>
    budget({
      id: i + 1,
      label: `budget_${String(i + 1).padStart(3, '0')}`,
      dimension_name: `role_${i + 1}`,
    })
  );
}

function pickerItems(n: number, prefix = 'role'): PickerItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    label: `${prefix}_${String(i + 1).padStart(3, '0')}`,
  }));
}

function httpError(status: number, body: unknown = null): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: body, url: '/x' });
}

describe('DfAiBudgetsComponent', () => {
  let fixture: ComponentFixture<DfAiBudgetsComponent>;
  let component: DfAiBudgetsComponent;
  let state$: BehaviorSubject<AiBudgetsAvailability>;
  let availability: {
    state$: BehaviorSubject<AiBudgetsAvailability>;
    recheck: jest.Mock;
    forbiddenMessage: string | null;
  };
  let api: {
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    scopeOptions: jest.Mock;
    searchScope: jest.Mock;
  };
  let dialog: { open: jest.Mock };
  let confirmResult: boolean;

  const el = (): HTMLElement => fixture.nativeElement;
  const q = (testId: string) =>
    el().querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  const qa = (testId: string) =>
    Array.from(el().querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`));
  const text = () => el().textContent ?? '';
  const list = (rows: Budget[], extra: Partial<BudgetList> = {}): BudgetList =>
    ({ resource: rows, usage_logging_enabled: true, ...extra }) as BudgetList;

  function create(
    state: AiBudgetsAvailability = 'available',
    rows: Budget[] = [budget()]
  ) {
    state$.next(state);
    api.list.mockReturnValue(of(list(rows)));
    fixture = TestBed.createComponent(DfAiBudgetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    state$ = new BehaviorSubject<AiBudgetsAvailability>('checking');
    availability = { state$, recheck: jest.fn(), forbiddenMessage: null };
    api = {
      list: jest.fn(() => of(list([]))),
      create: jest.fn(() => of(budget())),
      update: jest.fn(() => of(budget())),
      remove: jest.fn(() => of({ id: 1 })),
      scopeOptions: jest.fn(() =>
        of({ items: pickerItems(3), truncated: false })
      ),
      searchScope: jest.fn(() => of([])),
    };
    confirmResult = true;
    dialog = {
      open: jest.fn(() => ({ afterClosed: () => of(confirmResult) })),
    };

    TestBed.configureTestingModule({
      imports: [DfAiBudgetsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        { provide: BudgetsService, useValue: api },
        { provide: AiBudgetsAvailabilityService, useValue: availability },
      ],
    });
    // The component imports MatDialogModule, which provides its own MatDialog.
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
  });

  function fillValidForm() {
    component.openCreate();
    const form = component.form!;
    form.label = 'Marketing';
    form.dimension_type = 'role';
    component.pickScope(2);
    form.budget_usd = 25;
    fixture.detectChanges();
  }

  describe('server support', () => {
    it('shows a spinner and asks nothing while the check runs', () => {
      create('checking');
      expect(q('budget-checking')).not.toBeNull();
      expect(api.list).not.toHaveBeenCalled();
      expect(q('budget-new')).toBeNull();
    });

    it('says budgets are not available on this server, with no raw server text', () => {
      create('unsupported');
      expect(q('budget-unsupported')?.textContent).toContain(
        'AI budgets are not available on this server'
      );
      expect(api.list).not.toHaveBeenCalled();
      expect(q('budget-new')).toBeNull();
      expect(q('budget-table')).toBeNull();
      expect(text()).not.toContain('Could not find a service');
    });

    it('on a 403 shows the server reason and does not blame admin rights', () => {
      // A full admin on a too-low license gets this 403: the copy must not
      // tell them to ask a full administrator.
      availability.forbiddenMessage =
        'AI budget management requires a GOLD license.';
      create('forbidden');
      expect(q('budget-forbidden')?.textContent).toContain(
        "This account can't manage AI budgets on this server"
      );
      expect(q('budget-forbidden-detail')?.textContent).toContain(
        'requires a GOLD license'
      );
      expect(q('budget-forbidden')?.textContent).not.toContain(
        'full administrator'
      );
      expect(api.list).not.toHaveBeenCalled();
    });

    it('offers a retry when the check itself failed, and rechecks on click', () => {
      create('unknown');
      expect(q('budget-check-error')).not.toBeNull();
      expect(q('budget-unsupported')).toBeNull();
      q('budget-check-retry')!.click();
      expect(availability.recheck).toHaveBeenCalledTimes(1);
    });

    it('loads the list once the check passes', () => {
      create('checking');
      state$.next('available');
      fixture.detectChanges();
      expect(api.list).toHaveBeenCalledTimes(1);
      expect(qa('budget-row')).toHaveLength(1);
    });

    it('switches to the not available state when the list itself answers 404', () => {
      state$.next('available');
      api.list.mockReturnValue(
        throwError(() =>
          httpError(404, 'Could not find a service for _internal')
        )
      );
      fixture = TestBed.createComponent(DfAiBudgetsComponent);
      fixture.detectChanges();
      expect(q('budget-unsupported')).not.toBeNull();
      expect(text()).not.toContain('Could not find a service');
    });

    it('switches to the no access state when the list itself answers 403', () => {
      state$.next('available');
      api.list.mockReturnValue(
        throwError(() =>
          httpError(403, { error: { code: 403, message: 'Gold required.' } })
        )
      );
      fixture = TestBed.createComponent(DfAiBudgetsComponent);
      fixture.detectChanges();
      expect(q('budget-forbidden')).not.toBeNull();
      expect(q('budget-forbidden-detail')?.textContent).toContain(
        'Gold required.'
      );
    });
  });

  describe('list', () => {
    it('renders a row with scope, period, cap, spend and percent', () => {
      create('available', [budget({ hard_stop: true, blocking: true })]);
      const row = qa('budget-row')[0].textContent ?? '';
      expect(row).toContain('Sales monthly');
      expect(row).toContain('Role');
      expect(row).toContain('sales');
      expect(row).toContain('Monthly');
      expect(row).toContain('$50.00');
      expect(row).toContain('$12.50');
      expect(row).toContain('25%');
      expect(row).toContain('On');
      expect(q('budget-blocking')?.textContent).toContain('Blocking');
    });

    it('names a scope record that no longer exists', () => {
      create('available', [budget({ dimension_name: null, dimension_id: 44 })]);
      expect(qa('budget-row')[0].textContent).toContain('deleted #44');
    });

    it('shows the empty state when there are no budgets', () => {
      create('available', []);
      expect(q('budget-empty')?.textContent).toContain('No budgets yet');
      expect(q('budget-table')).toBeNull();
    });

    it('shows the error, not the empty state, when the list fails', () => {
      state$.next('available');
      api.list.mockReturnValue(
        throwError(() =>
          httpError(500, { error: { code: 500, message: 'Database is down.' } })
        )
      );
      fixture = TestBed.createComponent(DfAiBudgetsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(q('budget-error')?.textContent).toContain('Database is down.');
      expect(q('budget-empty')).toBeNull();

      // Refresh asks again and clears the error.
      api.list.mockReturnValue(of(list([budget()])));
      q('budget-refresh')!.click();
      fixture.detectChanges();
      expect(q('budget-error')).toBeNull();
      expect(qa('budget-row')).toHaveLength(1);
    });

    it('warns when usage logging is off', () => {
      state$.next('available');
      api.list.mockReturnValue(
        of(list([budget()], { usage_logging_enabled: false }))
      );
      fixture = TestBed.createComponent(DfAiBudgetsComponent);
      fixture.detectChanges();
      expect(q('budget-logging-off')).not.toBeNull();
    });

    it('never renders NaN or Infinity for a zero cap or a broken ratio', () => {
      create('available', [
        budget({
          id: 1,
          budget_usd: 0,
          spent_usd: 3,
          utilization: Infinity,
        }),
        budget({
          id: 2,
          budget_usd: NaN,
          spent_usd: NaN,
          utilization: NaN,
        }),
      ]);
      expect(text()).not.toContain('NaN');
      expect(text()).not.toContain('Infinity');
      expect(text()).not.toContain('∞');
    });
  });

  describe('money and percent', () => {
    it('shows a cap under one cent in full', () => {
      expect(capText({ budget_usd: 0.005 })).toBe('$0.005');
      expect(capText({ budget_usd: 1500 })).toBe('$1,500.00');
    });

    it('does not round spend up to the cap before the cap is reached', () => {
      const b = { budget_usd: 10, spent_usd: 9.99996, utilization: 0.999996 };
      expect(spentText(b)).toBe('$9.9999');
      expect(usedText(b)).toBe('99.9%');
    });

    it('shows exact figures once the cap is reached or passed', () => {
      expect(usedText({ budget_usd: 10, spent_usd: 10, utilization: 1 })).toBe(
        '100%'
      );
      expect(
        usedText({ budget_usd: 10, spent_usd: 25.04, utilization: 2.504 })
      ).toBe('250.4%');
      expect(spentText({ budget_usd: 10, spent_usd: 25.04 })).toBe('$25.04');
    });

    it('keeps float noise out of a plain figure', () => {
      expect(spentText({ budget_usd: 10, spent_usd: 0.57 })).toBe('$0.57');
      expect(
        usedText({ budget_usd: 10, spent_usd: 0.7, utilization: 0.07 })
      ).toBe('7%');
    });

    it('reads a zero, negative or missing cap as 0 percent', () => {
      expect(
        usedText({ budget_usd: 0, spent_usd: 5, utilization: Infinity })
      ).toBe('0%');
      expect(
        usedText({
          budget_usd: undefined as unknown as number,
          spent_usd: 5,
          utilization: NaN,
        })
      ).toBe('0%');
    });
  });

  describe('scale', () => {
    it('renders one page of 500 budgets and adds a page on demand', () => {
      create('available', budgets(500));
      expect(qa('budget-row')).toHaveLength(BUDGET_PAGE_SIZE);
      expect(q('budget-count')?.textContent).toContain('50 of 500 shown');
      q('budget-more')!.click();
      fixture.detectChanges();
      expect(qa('budget-row')).toHaveLength(BUDGET_PAGE_SIZE * 2);
    });

    it('filters by label or scope name and keeps the same array between checks', () => {
      create('available', budgets(500));
      component.onFilter('budget_49');
      fixture.detectChanges();
      // budget_490 to budget_499.
      expect(qa('budget-row')).toHaveLength(10);
      const before = component.visible;
      fixture.detectChanges();
      expect(component.visible).toBe(before);

      component.onFilter('role_500');
      fixture.detectChanges();
      expect(qa('budget-row')).toHaveLength(1);

      component.onFilter('no such budget');
      fixture.detectChanges();
      expect(q('budget-nomatch')).not.toBeNull();
    });

    it('bounds the role picker at 500 roles', () => {
      api.scopeOptions.mockReturnValue(
        of({ items: pickerItems(500), truncated: false })
      );
      create();
      q('budget-new')!.click();
      fixture.detectChanges();
      expect(qa('budget-scope-item').length).toBeLessThanOrEqual(60);
      expect(q('budget-scope-search')).not.toBeNull();
      expect(q('budget-scope-more')).not.toBeNull();
      expect(el().querySelectorAll('mat-option')).toHaveLength(0);
    });

    it('sends the search to the server when the list was capped', () => {
      api.scopeOptions.mockReturnValue(
        of({ items: pickerItems(100), truncated: true })
      );
      api.searchScope.mockReturnValue(of([{ id: 900, label: 'role_900' }]));
      create();
      component.openCreate();
      fixture.detectChanges();
      expect(q('budget-scope-status')?.textContent).toContain(
        'Showing the first 100 roles only'
      );

      component.searchScope('role_900').subscribe();
      expect(api.searchScope).toHaveBeenCalledWith('role', 'role_900');

      // A record found by search can be picked and is named in the form.
      component.pickScope(900);
      fixture.detectChanges();
      expect(component.form!.dimension_id).toBe(900);
      expect(q('budget-scope-selected')?.textContent).toContain('role_900');
    });

    it('loads each scope type on demand and clears the pick on a type change', () => {
      create();
      component.openCreate();
      expect(api.scopeOptions).toHaveBeenLastCalledWith('role');
      component.pickScope(2);
      component.form!.dimension_type = 'user';
      component.onScopeTypeChange();
      fixture.detectChanges();
      expect(api.scopeOptions).toHaveBeenLastCalledWith('user');
      expect(component.form!.dimension_id).toBeNull();
      expect(component.scopeSelected).toEqual([]);

      component.form!.dimension_type = 'global';
      component.onScopeTypeChange();
      fixture.detectChanges();
      expect(api.scopeOptions).toHaveBeenCalledTimes(2);
      expect(q('budget-scope-record')).toBeNull();
    });
  });

  describe('create', () => {
    it('opens a form with hard stop off and no warning', () => {
      create();
      q('budget-new')!.click();
      fixture.detectChanges();
      expect(q('budget-form')).not.toBeNull();
      expect(component.form!.hard_stop).toBe(false);
      expect(q('budget-hard-stop-warning')).toBeNull();
    });

    it('shows the plain warning when hard stop is turned on', () => {
      create();
      component.openCreate();
      component.form!.hard_stop = true;
      fixture.detectChanges();
      expect(q('budget-hard-stop-warning')?.textContent).toContain(
        'Requests will be refused with HTTP 429'
      );
    });

    it('names what is missing and keeps Save disabled until the form is valid', () => {
      create();
      component.openCreate();
      fixture.detectChanges();
      const save = q('budget-save') as HTMLButtonElement;
      expect(save.disabled).toBe(true);
      expect(q('budget-form-problem')?.textContent).toContain('Enter a label.');

      component.form!.label = 'Marketing';
      expect(component.formProblem).toBe('aiBudgets.validation.scope');
      component.pickScope(2);
      expect(component.formProblem).toBe('aiBudgets.validation.cap');
      component.form!.budget_usd = 0;
      expect(component.formProblem).toBe('aiBudgets.validation.cap');
      component.form!.budget_usd = -5;
      expect(component.formProblem).toBe('aiBudgets.validation.cap');
      component.form!.budget_usd = 100000000;
      expect(component.formProblem).toBe('aiBudgets.validation.capMax');
      component.form!.budget_usd = 25;
      component.form!.alert_webhook_url = 'ftp://example.test/hook';
      expect(component.formProblem).toBe('aiBudgets.validation.webhook');
      component.form!.alert_webhook_url = 'https://example.test/hook';
      expect(component.formProblem).toBeNull();

      fixture.detectChanges();
      expect(save.disabled).toBe(false);
      expect(q('budget-form-problem')).toBeNull();
    });

    it('does not ask for a scope record on a global budget', () => {
      create();
      component.openCreate();
      component.form!.label = 'Everything';
      component.form!.dimension_type = 'global';
      component.onScopeTypeChange();
      component.form!.budget_usd = 1000;
      expect(component.canSave).toBe(true);
    });

    it('posts the payload, closes the form and reloads the list', () => {
      create();
      fillValidForm();
      component.form!.hard_stop = true;
      api.list.mockClear();
      component.save();
      fixture.detectChanges();
      expect(api.create).toHaveBeenCalledWith({
        label: 'Marketing',
        dimension_type: 'role',
        dimension_id: 2,
        period: 'monthly',
        budget_usd: 25,
        hard_stop: true,
        alert_webhook_url: null,
      });
      expect(component.form).toBeNull();
      expect(api.list).toHaveBeenCalledTimes(1);
    });

    it('sends one request for a double submit', () => {
      create();
      fillValidForm();
      const pending = new Subject<Budget>();
      api.create.mockReturnValue(pending);
      component.save();
      component.save();
      fixture.detectChanges();
      expect(api.create).toHaveBeenCalledTimes(1);
      expect((q('budget-save') as HTMLButtonElement).disabled).toBe(true);
      expect((q('budget-cancel') as HTMLButtonElement).disabled).toBe(true);
      pending.next(budget());
      pending.complete();
      expect(component.saving).toBe(false);
    });

    it('keeps the form and shows the server message when the save fails', () => {
      create();
      fillValidForm();
      api.list.mockClear();
      api.create.mockReturnValue(
        throwError(() =>
          httpError(400, {
            error: {
              code: 400,
              message: 'dimension_id does not match an existing role.',
            },
          })
        )
      );
      component.save();
      fixture.detectChanges();
      expect(component.form).not.toBeNull();
      expect(component.form!.label).toBe('Marketing');
      expect(q('budget-form-error')?.textContent).toContain(
        'dimension_id does not match an existing role.'
      );
      expect(api.list).not.toHaveBeenCalled();
      expect(component.saving).toBe(false);
    });
  });

  describe('alert webhooks switch', () => {
    it('shows the webhook fields when the server does not say', () => {
      create();
      component.openCreate();
      fixture.detectChanges();
      expect(q('budget-webhook')).not.toBeNull();
      expect(q('budget-webhooks-off')).toBeNull();
    });

    it('hides them and sends no webhook field when the server has them off', () => {
      state$.next('available');
      api.list.mockReturnValue(
        of(list([budget()], { alert_webhooks_enabled: false }))
      );
      fixture = TestBed.createComponent(DfAiBudgetsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      fillValidForm();
      // Left over from before the switch was turned off: must not block or be sent.
      component.form!.alert_webhook_url = 'not a url';
      fixture.detectChanges();
      expect(q('budget-webhook')).toBeNull();
      expect(q('budget-webhooks-off')?.textContent).toContain(
        'Alert webhooks are turned off on this server'
      );
      component.save();
      const payload = api.create.mock.calls[0][0];
      expect(payload).not.toHaveProperty('alert_webhook_url');
      expect(payload).not.toHaveProperty('alert_webhook_auth_header');
      expect(payload).not.toHaveProperty('clear_alert_webhook_auth');
    });
  });

  describe('edit', () => {
    it('fills the form from the row and names the current scope record', () => {
      create('available', [
        budget({ id: 5, has_alert_webhook_auth: true, hard_stop: true }),
      ]);
      q('budget-edit')!.click();
      fixture.detectChanges();
      expect(component.form!.id).toBe(5);
      expect(component.form!.alert_webhook_auth_header).toBe('');
      expect(component.scopeSelected).toEqual([7]);
      expect(q('budget-scope-selected')?.textContent).toContain('sales');
      expect(q('budget-hard-stop-warning')).not.toBeNull();
    });

    it('patches the row and never sends a blank auth header', () => {
      create('available', [budget({ id: 5, has_alert_webhook_auth: true })]);
      component.openEdit(component.budgets[0]);
      component.form!.budget_usd = 75;
      component.save();
      expect(api.update).toHaveBeenCalledTimes(1);
      const [id, payload] = api.update.mock.calls[0];
      expect(id).toBe(5);
      expect(payload.budget_usd).toBe(75);
      expect(payload).not.toHaveProperty('alert_webhook_auth_header');
      expect(payload).not.toHaveProperty('clear_alert_webhook_auth');
      expect(api.create).not.toHaveBeenCalled();
    });
  });

  describe('enable and disable', () => {
    const toggleButton = () =>
      el().querySelector<HTMLButtonElement>(
        '[data-testid="budget-row"] mat-slide-toggle button'
      )!;

    it('patches is_active and shows the saved row', () => {
      create();
      api.update.mockReturnValue(of(budget({ is_active: false })));
      toggleButton().click();
      fixture.detectChanges();
      expect(api.update).toHaveBeenCalledWith(1, { is_active: false });
      expect(component.budgets[0].is_active).toBe(false);
    });

    it('puts the switch back and says why when the change fails', () => {
      create();
      api.update.mockReturnValue(
        throwError(() =>
          httpError(500, { error: { code: 500, message: 'Write failed.' } })
        )
      );
      toggleButton().click();
      fixture.detectChanges();
      expect(component.budgets[0].is_active).toBe(true);
      expect(toggleButton().getAttribute('aria-checked')).toBe('true');
      expect(q('budget-error')?.textContent).toContain('Write failed.');
    });

    it('locks the row while a change is in flight, so a second click sends nothing', () => {
      create();
      const pending = new Subject<Budget>();
      api.update.mockReturnValue(pending);
      toggleButton().click();
      fixture.detectChanges();
      expect(toggleButton().disabled).toBe(true);
      expect((q('budget-edit') as HTMLButtonElement).disabled).toBe(true);
      expect((q('budget-delete') as HTMLButtonElement).disabled).toBe(true);
      toggleButton().click();
      expect(api.update).toHaveBeenCalledTimes(1);
      pending.next(budget({ is_active: false }));
      pending.complete();
      fixture.detectChanges();
      expect(toggleButton().disabled).toBe(false);
    });
  });

  describe('delete', () => {
    it('asks first, then deletes and reloads', () => {
      create();
      api.list.mockClear();
      q('budget-delete')!.click();
      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(dialog.open.mock.calls[0][1].data).toEqual({
        title: 'aiBudgets.delete.title',
        message: 'aiBudgets.delete.message',
      });
      expect(api.remove).toHaveBeenCalledWith(1);
      expect(api.list).toHaveBeenCalledTimes(1);
    });

    it('deletes nothing when the dialog is dismissed', () => {
      create();
      confirmResult = false;
      q('budget-delete')!.click();
      expect(api.remove).not.toHaveBeenCalled();
    });

    it('keeps the row and says why when the delete fails', () => {
      create();
      api.list.mockClear();
      api.remove.mockReturnValue(
        throwError(() =>
          httpError(500, { error: { code: 500, message: 'Delete failed.' } })
        )
      );
      q('budget-delete')!.click();
      fixture.detectChanges();
      expect(qa('budget-row')).toHaveLength(1);
      expect(q('budget-error')?.textContent).toContain('Delete failed.');
      expect(api.list).not.toHaveBeenCalled();
    });

    it('sends one delete while the first is in flight', () => {
      create();
      const pending = new Subject<unknown>();
      api.remove.mockReturnValue(pending);
      q('budget-delete')!.click();
      fixture.detectChanges();
      expect((q('budget-delete') as HTMLButtonElement).disabled).toBe(true);
      component.confirmDelete(component.budgets[0]);
      expect(api.remove).toHaveBeenCalledTimes(1);
      expect(dialog.open).toHaveBeenCalledTimes(1);
    });
  });

  it('has no untranslated key on screen in any state', () => {
    create('available', [budget({ hard_stop: true, blocking: true })]);
    component.openCreate();
    component.form!.hard_stop = true;
    fixture.detectChanges();
    expect(text()).not.toMatch(/aiBudgets\./);
  });
});
