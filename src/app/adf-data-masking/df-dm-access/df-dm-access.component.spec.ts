import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DfDmAccessComponent, liveGrants } from './df-dm-access.component';
import { DataMaskingStore } from '../data-masking.store';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { dmTransloco } from '../dm-testing';
import { AccessSettings } from '../data-masking.types';

const HOUR = 3_600_000;
const inHours = (h: number) => new Date(Date.now() + h * HOUR).toISOString();

function settings(over: Partial<AccessSettings> = {}): AccessSettings {
  return {
    admins: {
      mode: 'selected',
      grants: [
        { adminId: 2, name: 'Priya Shah', email: 'p@x', expiresAt: inHours(4) },
      ],
      available: [
        { adminId: 1, name: 'Kevin Admin', email: 'k@x' },
        { adminId: 2, name: 'Priya Shah', email: 'p@x', you: true },
        { adminId: 3, name: 'Sam Lee', email: 's@x' },
      ],
    },
    ai: 'masked',
    roles: [
      { roleId: 1, name: 'support', enabled: true, scope: 'except_restricted' },
      {
        roleId: 2,
        name: 'billing',
        enabled: false,
        scope: 'except_restricted',
      },
    ],
    ...over,
  };
}

describe('DfDmAccessComponent', () => {
  let fixture: ComponentFixture<DfDmAccessComponent>;
  let store: DataMaskingStore;
  let api: {
    updateAccess: jest.Mock;
    access: jest.Mock;
    overview: jest.Mock;
    baselines: jest.Mock;
  };
  let dialog: { open: jest.Mock };
  let closeWith: boolean;

  const el = () => fixture.nativeElement as HTMLElement;
  const toggle = (group: string, label: string) =>
    Array.from(
      el().querySelectorAll(`[data-testid="${group}"] mat-button-toggle`)
    ).find(t => t.textContent?.trim() === label) as HTMLElement;
  const isDisabled = (t: HTMLElement) =>
    t.classList.contains('mat-button-toggle-disabled');
  const box = (id: number) =>
    el().querySelector(
      `[data-testid="dm-admin-${id}"] input`
    ) as HTMLInputElement;
  const role = (id: number) =>
    el().querySelector(
      `[data-testid="dm-role-${id}"] button[role="switch"]`
    ) as HTMLButtonElement;

  function create(
    canGrant: boolean,
    access = settings(),
    tracked: string[] = []
  ) {
    api = {
      updateAccess: jest.fn(() => of(access)),
      access: jest.fn(() => of(access)),
      overview: jest.fn(() => of(store.overview)),
      baselines: jest.fn(() =>
        of(tracked.map(id => ({ id, name: id, adopted: true })))
      ),
    };
    closeWith = true;
    dialog = { open: jest.fn(() => ({ afterClosed: () => of(closeWith) })) };
    TestBed.configureTestingModule({
      imports: [DfDmAccessComponent, NoopAnimationsModule, dmTransloco()],
      providers: [
        DataMaskingStore,
        { provide: DfDataMaskingApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
    store = TestBed.inject(DataMaskingStore);
    store.overview = {
      mode: 'preview',
      scan: { status: 'idle', columns: 3, finishedAt: '2026-10-28T00:00:00Z' },
      counts: { masked: 1, review: 1, clear: 1 },
      you: { canGrant, seesRealValues: false },
    };
    store.access = access;
    fixture = TestBed.createComponent(DfDmAccessComponent);
    fixture.detectChanges();
  }

  it('the super admin can loosen anything', () => {
    create(true);
    expect(el().querySelector('[data-testid="dm-access-lock"]')).toBeNull();
    expect(isDisabled(toggle('dm-admin-mode', 'All admins'))).toBe(false);
    expect(isDisabled(toggle('dm-ai-mode', 'Same as admins'))).toBe(false);
    expect(box(3).disabled).toBe(false);
    expect(role(2).disabled).toBe(false);
  });

  it('any other admin can still tighten: the loosening choices lock', () => {
    create(false);
    const lock = el().querySelector('[data-testid="dm-access-lock"]');
    expect(lock?.textContent?.trim()).toBe(
      'lock Only the super admin can give access.'
    );
    // Narrower modes stay open, wider ones lock.
    expect(isDisabled(toggle('dm-admin-mode', 'No one'))).toBe(false);
    expect(isDisabled(toggle('dm-admin-mode', 'All admins'))).toBe(true);
    // AI back to masked is fine; same as admins is not.
    expect(isDisabled(toggle('dm-ai-mode', 'Always masked'))).toBe(false);
    expect(isDisabled(toggle('dm-ai-mode', 'Same as admins'))).toBe(true);
    // Any grant can be removed; nobody new can be granted.
    expect(box(2).disabled).toBe(false);
    expect(box(3).disabled).toBe(true);
    expect(box(1).disabled).toBe(true);
    // An enabled role can be disabled; a disabled one cannot be enabled.
    expect(role(1).disabled).toBe(false);
    expect(role(2).disabled).toBe(true);
  });

  it('removing a grant sends only what is left, with no new durations', () => {
    create(false);
    box(2).click();
    expect(api.updateAccess).toHaveBeenCalledWith({ admins: { grants: [] } });
  });

  it('only durations that end sooner than the grant are open to others', () => {
    create(false);
    const cmp = fixture.componentInstance;
    const priya = settings().admins.available[1];
    expect(cmp.durationLocked(priya, '1h')).toBe(false);
    expect(cmp.durationLocked(priya, '8h')).toBe(true);
    expect(cmp.durationLocked(priya, 'forever')).toBe(true);
    // A grant until turned off can be shortened to anything finite.
    TestBed.resetTestingModule();
    const forever = settings();
    forever.admins.grants[0].expiresAt = null;
    create(false, forever);
    expect(fixture.componentInstance.durationLocked(priya, '7d')).toBe(false);
    expect(fixture.componentInstance.durationLocked(priya, 'forever')).toBe(
      false
    );
  });

  it('scope: narrowing is open to others, widening to every class is not', () => {
    create(false);
    const cmp = fixture.componentInstance;
    const support = settings().roles[0];
    expect(cmp.scopeLocked(support, 'all')).toBe(true);
    expect(
      cmp.scopeLocked({ ...support, scope: 'all' }, 'except_restricted')
    ).toBe(false);
  });

  it('never shows or sends a grant that has expired since the page loaded', () => {
    const a = settings();
    a.admins.grants.push({
      adminId: 3,
      name: 'Sam Lee',
      email: 's@x',
      expiresAt: inHours(-1),
    });
    expect(liveGrants(a).map(g => g.adminId)).toEqual([2]);
    create(true, a);
    expect(box(3).checked).toBe(false);
    // Granting Kevin re-sends Priya (kept) but not Sam's expired grant,
    // which the server would otherwise treat as a fresh 8 hour grant.
    box(1).click();
    expect(api.updateAccess).toHaveBeenCalledWith({
      admins: { grants: [{ adminId: 2 }, { adminId: 1, duration: '8h' }] },
    });
  });

  it('re-reads access every time the tab opens', () => {
    create(true);
    expect(api.access).toHaveBeenCalledTimes(1);
    // A revoke made elsewhere (CLI, another admin) shows on the next visit.
    api.access.mockReturnValue(
      of(settings({ admins: { ...settings().admins, grants: [] } }))
    );
    TestBed.createComponent(DfDmAccessComponent).detectChanges();
    expect(api.access).toHaveBeenCalledTimes(2);
    expect(store.access?.admins.grants).toEqual([]);
  });

  it('a role change sends only that role, with the version it was read at', () => {
    create(true, { ...settings(), version: 'v7' });
    role(2).click();
    expect(api.updateAccess).toHaveBeenCalledWith({
      roles: [{ roleId: 2, enabled: true, scope: 'except_restricted' }],
      version: 'v7',
    });
  });

  it('when a grant ends, the tab re-reads access without a reload', fakeAsync(() => {
    const a = settings();
    a.admins.grants[0].expiresAt = new Date(Date.now() + 5000).toISOString();
    create(true, a);
    expect(api.access).toHaveBeenCalledTimes(1);
    api.access.mockReturnValue(
      of(settings({ admins: { ...settings().admins, grants: [] } }))
    );
    tick(6500);
    fixture.detectChanges();
    expect(api.access).toHaveBeenCalledTimes(2);
    expect(box(2).checked).toBe(false);
    fixture.destroy();
  }));

  it('All admins asks first; cancel changes nothing', () => {
    create(true);
    closeWith = false;
    fixture.componentInstance.setAdminMode('all');
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open.mock.calls[0][1].data.message).toBe(
      'All admins will see real values in 2 columns.'
    );
    expect(api.updateAccess).not.toHaveBeenCalled();
    closeWith = true;
    fixture.componentInstance.setAdminMode('all');
    expect(api.updateAccess).toHaveBeenCalledWith({ admins: { mode: 'all' } });
    // Narrowing never asks.
    dialog.open.mockClear();
    store.access = {
      ...settings(),
      admins: { ...settings().admins, mode: 'all' },
    };
    fixture.componentInstance.setAdminMode('none');
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('AI "Same as admins" asks first; back to masked never does', () => {
    create(true);
    fixture.componentInstance.setAi('same_as_admins');
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(api.updateAccess).toHaveBeenCalledWith({ ai: 'same_as_admins' });
    dialog.open.mockClear();
    store.access = { ...settings(), ai: 'same_as_admins' };
    fixture.componentInstance.setAi('masked');
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('marks durations longer than a tracked baseline allows', () => {
    create(true, settings(), ['gdpr', 'hipaa']);
    const cmp = fixture.componentInstance;
    // HIPAA (8 h) is the strictest tracked one.
    expect(cmp.exceeds('1h')).toBeNull();
    expect(cmp.exceeds('8h')).toBeNull();
    expect(cmp.exceeds('24h')).toBe('HIPAA');
    expect(cmp.exceeds('forever')).toBe('HIPAA');
    TestBed.resetTestingModule();
    create(true);
    expect(fixture.componentInstance.exceeds('forever')).toBeNull();
  });

  it('the duration list grows to fit "Exceeds HIPAA" on one line; otherwise it matches its select', () => {
    const durationSelect = () =>
      fixture.debugElement
        .queryAll(By.directive(MatSelect))
        .map(d => d.componentInstance as MatSelect)
        .find(s => s.value === '8h' || s.value === '24h' || s.value === '1h');
    create(true, settings(), ['hipaa']);
    expect(durationSelect()!.panelWidth).toBeNull();
    TestBed.resetTestingModule();
    create(true);
    expect(durationSelect()!.panelWidth).toBe('auto');
  });
});
