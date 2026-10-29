import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfDataMaskingApiService } from 'src/app/adf-data-masking/data-masking-api.service';
import * as fileUtils from 'src/app/shared/utilities/file';
import { DfComplianceComponent } from './df-compliance.component';
import { DfComplianceApiService } from '../compliance-api.service';
import {
  control,
  cpTransloco,
  detail,
  overview,
  summary,
} from '../compliance-testing';
import { BaselineDetail } from '../compliance.types';

jest.mock('src/app/shared/utilities/file', () => ({
  saveRawAsFile: jest.fn(),
}));

/** The shared paywall tracks a hit and boots Calendly: stubbed here. */
@Component({ selector: 'df-paywall', standalone: true, template: '' })
class StubPaywallComponent {
  @Input() serviceName = '';
}

describe('DfComplianceComponent', () => {
  let fixture: ComponentFixture<DfComplianceComponent>;
  let api: Record<string, jest.Mock>;
  let masking: { overview: jest.Mock };
  let dialog: { open: jest.Mock };
  let closeWith: unknown;
  let query: BehaviorSubject<ParamMap>;
  let hipaa: BaselineDetail;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (id: string) =>
    el().querySelector(`[data-testid="${id}"]`) as HTMLElement | null;

  function create(params: Record<string, string> = {}, access = 'ok') {
    query = new BehaviorSubject(convertToParamMap(params));
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        data: of({ data: access }),
        queryParamMap: query,
        snapshot: { queryParamMap: convertToParamMap(params) },
      },
    });
    fixture = TestBed.createComponent(DfComplianceComponent);
    fixture.detectChanges();
  }

  beforeEach(() => {
    hipaa = detail();
    api = {
      list: jest.fn(() =>
        of([
          summary(),
          summary({
            id: 'pci_dss',
            name: 'PCI DSS',
            vertical: 'payments',
            adopted: true,
            score: { pass: 7, fail: 5, manual: 1, total: 13 },
          }),
          summary({ id: 'soc2', name: 'SOC 2', vertical: 'general' }),
        ])
      ),
      get: jest.fn((id: string) =>
        of(
          id === 'hipaa'
            ? hipaa
            : detail({ id, name: id === 'soc2' ? 'SOC 2' : 'PCI DSS' })
        )
      ),
      apply: jest.fn(() => of(detail({ adopted: true, changes: [] }))),
      changesWithModeOn: jest.fn(() =>
        of([{ id: 'mode', text: 'Turn masking on (now Preview).' }])
      ),
      stopTracking: jest.fn(() => of({})),
      report: jest.fn(() => of('control,status\n')),
    };
    masking = { overview: jest.fn(() => of(overview('preview'))) };
    closeWith = undefined;
    dialog = {
      open: jest.fn(() => ({ afterClosed: () => of(closeWith) })),
    };
    TestBed.configureTestingModule({
      imports: [DfComplianceComponent, NoopAnimationsModule, cpTransloco()],
      providers: [
        provideRouter([]),
        { provide: DfComplianceApiService, useValue: api },
        { provide: DfDataMaskingApiService, useValue: masking },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: dialog });
  });

  it('groups baselines by vertical in the rail, with scores', () => {
    create({ baseline: 'hipaa' });
    const heads = Array.from(el().querySelectorAll('.rail-vertical')).map(h =>
      h.textContent?.replace(/\s+/g, ' ').trim()
    );
    expect(heads).toEqual([
      'health_and_safety Healthcare',
      'credit_card Payments',
      'verified_user General',
    ]);
    const pci = q('cp-rail-pci_dss')!;
    expect(pci.querySelector('.rail-score')?.textContent).toBe('7/12');
    expect(pci.querySelector('.rail-tracking')).toBeTruthy();
    expect(pci.getAttribute('aria-label')).toBe(
      'PCI DSS, Tracking, 7 of 12 checks pass'
    );
    expect(q('cp-rail-hipaa')!.getAttribute('aria-current')).toBe('true');
  });

  it('shows the score of automated checks only', () => {
    create({ baseline: 'hipaa' });
    expect(q('cp-score')!.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 of 3'
    );
    const meter = el().querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-valuenow')).toBe('1');
    expect(meter.getAttribute('aria-valuemax')).toBe('3');
    expect(meter.getAttribute('aria-label')).toBe('1 of 3 checks pass');
  });

  it('gives each check a spoken status, refs as chips and at most one action', () => {
    create({ baseline: 'hipaa' });
    const review = q('cp-control-masking.review')!;
    expect(review.querySelector('.sr-only')?.textContent).toBe('Fails:');
    expect(review.querySelector('.c-detail')?.textContent).toBe(
      '24 columns to review'
    );
    expect(
      Array.from(review.querySelectorAll('.ref')).map(r => r.textContent)
    ).toEqual(['45 CFR 164.514(b)']);
    const fix = review.querySelector('[data-testid="cp-fix"]')!;
    expect(fix.getAttribute('href')).toBe(
      '/api-security/data-masking?tab=columns'
    );
    expect(fix.getAttribute('aria-label')).toBe('Fix: Review queue is empty');
    // Apply fixes it: a Fix button that opens Apply. Passing: no action.
    const applyFix = q('cp-control-access.ai')!.querySelector(
      '[data-testid="cp-fix"]'
    )!;
    expect(applyFix.tagName).toBe('BUTTON');
    (applyFix as HTMLButtonElement).click();
    expect(dialog.open.mock.calls[0][1].data.turnOn).toBe(false);
    expect(
      q('cp-control-masking.mode')!.querySelector('[data-testid="cp-fix"]')
    ).toBeNull();
    // n/a trails the checks that count.
    const ids = Array.from(
      q('cp-controls')!.querySelectorAll('[data-testid^="cp-control-"]')
    ).map(li => li.getAttribute('data-testid'));
    expect(ids[ids.length - 1]).toBe('cp-control-platform.rate_limit');
  });

  it('keeps manual checks collapsed at the end until asked', () => {
    create({ baseline: 'hipaa' });
    expect(q('cp-control-manual.encryption')).toBeNull();
    const toggle = q('cp-manual-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('Manual checks');
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(q('cp-control-manual.encryption')).toBeTruthy();
  });

  it('Apply confirms with exactly the server changes and the turn-on option', () => {
    create({ baseline: 'hipaa' });
    expect(q('cp-apply')!.textContent).toContain('2');
    closeWith = { turnOn: true };
    q('cp-apply')!.click();
    const data = dialog.open.mock.calls[0][1].data;
    expect(data.name).toBe('HIPAA');
    expect(data.changes).toEqual(hipaa.changes);
    expect(data.offerTurnOn).toBe(true);
    expect(api['apply']).toHaveBeenCalledWith('hipaa', true);
  });

  it('hands the dialog what Apply would change with masking turned on', () => {
    create({ baseline: 'hipaa' });
    q('cp-apply')!.click();
    const data = dialog.open.mock.calls[0][1].data;
    let shown: unknown;
    data.changesOn$.subscribe((c: unknown) => (shown = c));
    expect(api['changesWithModeOn']).toHaveBeenCalledWith('hipaa');
    expect(shown).toEqual([
      { id: 'mode', text: 'Turn masking on (now Preview).' },
    ]);
  });

  it('does not offer turning masking on when it already is', () => {
    masking.overview.mockReturnValue(of(overview('on')));
    create({ baseline: 'hipaa' });
    q('cp-apply')!.click();
    expect(dialog.open.mock.calls[0][1].data.offerTurnOn).toBe(false);
    expect(dialog.open.mock.calls[0][1].data.changesOn$).toBeUndefined();
    // Cancel applies nothing.
    expect(api['apply']).not.toHaveBeenCalled();
  });

  it('a tracked baseline with nothing to change or fix has no Apply, but Stop tracking', () => {
    hipaa = detail({
      adopted: true,
      adoptedAt: '2026-10-20T10:00:00Z',
      changes: [],
      controls: detail().controls.map(c =>
        c.fix.kind === 'apply' ? { ...c, status: 'pass' as const } : c
      ),
    });
    create({ baseline: 'hipaa' });
    expect(q('cp-apply')).toBeNull();
    expect(q('cp-tracking')!.textContent).toContain('Tracking');
    q('cp-stop')!.click();
    expect(api['stopTracking']).toHaveBeenCalledWith('hipaa');
  });

  it('exports from the menu', () => {
    create({ baseline: 'hipaa' });
    q('cp-export')!.click();
    fixture.detectChanges();
    const csv = document.querySelector(
      '[data-testid="cp-export-csv"]'
    ) as HTMLButtonElement;
    expect(csv).toBeTruthy();
    csv.click();
    expect(api['report']).toHaveBeenCalledWith('hipaa', 'csv');
    expect(fileUtils.saveRawAsFile).toHaveBeenCalled();
  });

  it('follows ?baseline= and writes the selection back to it', () => {
    create({ baseline: 'hipaa' });
    const router = TestBed.inject(Router);
    const nav = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    q('cp-rail-soc2')!.click();
    fixture.detectChanges();
    expect(nav).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { baseline: 'soc2' },
        replaceUrl: true,
      })
    );
    expect(el().querySelector('#cp-title')?.textContent).toBe('SOC 2 baseline');
    query.next(convertToParamMap({ baseline: 'pci_dss' }));
    fixture.detectChanges();
    expect(el().querySelector('#cp-title')?.textContent).toBe(
      'PCI DSS baseline'
    );
  });

  it('titles the page as a baseline, names what it maps to and that it is not a certification', () => {
    hipaa = detail({
      frameworks: ['HIPAA Security Rule', 'HIPAA Privacy Rule'],
    });
    create({ baseline: 'hipaa' });
    expect(el().querySelector('#cp-title')?.textContent).toBe('HIPAA baseline');
    expect(q('cp-mapped')!.textContent?.trim()).toBe(
      'Mapped to HIPAA Security Rule, HIPAA Privacy Rule · Not a certification'
    );
  });

  describe('a failing "Masking is on" check (fix kind apply)', () => {
    // What the real backend returns after a default Apply on an instance in
    // Preview: adopted, nothing left in `changes`, masking.mode failing with
    // fix {kind:'apply', route:null} (GET /system/security_baseline/soc2).
    beforeEach(() => {
      hipaa = detail({
        adopted: true,
        adoptedAt: '2026-10-29T06:00:00Z',
        changes: [],
        controls: [
          control({
            id: 'masking.mode',
            title: 'Masking is on',
            status: 'fail',
            detail: 'Masking is in Preview: values are not masked yet.',
            fix: { kind: 'apply', route: null },
          }),
          control({ id: 'access.ai', title: 'AI masked', status: 'pass' }),
        ],
      });
    });

    it('keeps Apply and gives the check a Fix that turns masking on', () => {
      create({ baseline: 'hipaa' });
      expect(q('cp-apply')).toBeTruthy();
      const row = q('cp-control-masking.mode')!;
      expect(row.classList).toContain('is-fail');
      const fix = row.querySelector('[data-testid="cp-fix"]') as HTMLElement;
      expect(fix).toBeTruthy();
      closeWith = { turnOn: true };
      fix.click();
      const data = dialog.open.mock.calls[0][1].data;
      expect(data.offerTurnOn).toBe(true);
      expect(data.turnOn).toBe(true);
      expect(api['apply']).toHaveBeenCalledWith('hipaa', true);
    });

    it('the header Apply leaves "turn masking on" for the admin to tick', () => {
      create({ baseline: 'hipaa' });
      q('cp-apply')!.click();
      expect(dialog.open.mock.calls[0][1].data.turnOn).toBe(false);
    });

    it('before the first scan, never offers turning masking on; the Fix goes to Data Masking', () => {
      masking.overview.mockReturnValue(
        of(overview('preview', { finishedAt: null, columns: 0 }))
      );
      create({ baseline: 'hipaa' });
      const fix = q('cp-control-masking.mode')!.querySelector(
        '[data-testid="cp-fix"]'
      )!;
      expect(fix.tagName).toBe('A');
      expect(fix.getAttribute('href')).toBe('/api-security/data-masking');
      q('cp-apply')!.click();
      const data = dialog.open.mock.calls[0][1].data;
      expect(data.offerTurnOn).toBe(false);
      expect(data.turnOn).toBe(false);
      expect(data.changesOn$).toBeUndefined();
    });
  });

  it('shows the first scan Apply started, with its progress', () => {
    masking.overview.mockReturnValue(
      of(overview('preview', { finishedAt: null, columns: 0 }))
    );
    create({ baseline: 'hipaa' });
    expect(q('cp-scanning')).toBeNull();
    api['apply'].mockReturnValue(
      of({ ...detail({ adopted: true, changes: [] }), scanStarted: true })
    );
    masking.overview.mockReturnValue(
      of(
        overview('preview', {
          status: 'running',
          progress: 30,
          finishedAt: null,
        })
      )
    );
    closeWith = { turnOn: false };
    q('cp-apply')!.click();
    fixture.detectChanges();
    expect(q('cp-scanning')!.textContent).toContain('Scanning databases…');
    expect(q('cp-scanning')!.textContent).toContain('30%');
    const snack = TestBed.inject(DfSnackbarService) as unknown as {
      openSnackBar: jest.Mock;
    };
    expect(snack.openSnackBar).toHaveBeenCalledWith(
      'HIPAA baseline applied. Scanning…',
      'success'
    );
    fixture.destroy();
  });

  it('without the security_baseline resource shows the shared paywall, on any license', () => {
    TestBed.overrideComponent(DfComplianceComponent, {
      remove: { imports: [DfPaywallComponent] },
      add: { imports: [StubPaywallComponent] },
    });
    create({}, 'paywall');
    const paywall = fixture.debugElement.query(
      By.directive(StubPaywallComponent)
    );
    expect(paywall).toBeTruthy();
    expect(paywall.componentInstance.serviceName).toBe('Compliance');
    expect(el().querySelector('.cp')).toBeNull();
    expect(api['list']).not.toHaveBeenCalled();
  });

  it('offers retry when the list fails', () => {
    api['list'].mockReturnValueOnce(throwError(() => ({ status: 500 })));
    create();
    expect(q('cp-load-failed')).toBeTruthy();
  });
});
