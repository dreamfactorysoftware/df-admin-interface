import {
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { caseInterceptor } from 'src/app/shared/interceptors/case.interceptor';
import { errorInterceptor } from 'src/app/shared/interceptors/error.interceptor';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { DfTrialService } from 'src/app/shared/services/df-trial.service';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { Subject, of, throwError } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfDataMaskingApiService } from 'src/app/adf-data-masking/data-masking-api.service';
import * as fileUtils from 'src/app/shared/utilities/file';
import { DfComplianceApiService } from './compliance-api.service';
import {
  ComplianceStore,
  SCAN_POLL_MS,
  fixLink,
  parseTextError,
  scoreOf,
} from './compliance.store';
import {
  control,
  cpTransloco,
  detail,
  overview,
  summary,
} from './compliance-testing';
import { BaselineDetail } from './compliance.types';

jest.mock('src/app/shared/utilities/file', () => ({
  saveRawAsFile: jest.fn(),
}));

describe('ComplianceStore', () => {
  let store: ComplianceStore;
  let api: Record<string, jest.Mock>;
  let masking: { overview: jest.Mock };
  let snack: { openSnackBar: jest.Mock; openError: jest.Mock };

  const list = () => [
    summary({ id: 'soc2', name: 'SOC 2', vertical: 'general' }),
    summary(),
    summary({
      id: 'pci_dss',
      name: 'PCI DSS',
      vertical: 'payments',
      adopted: true,
    }),
    summary({ id: 'iso27001', name: 'ISO 27001', vertical: 'general' }),
  ];

  beforeEach(() => {
    api = {
      list: jest.fn(() => of(list())),
      get: jest.fn((id: string) => of(detail({ id, name: id.toUpperCase() }))),
      apply: jest.fn(),
      stopTracking: jest.fn(() => of({})),
      report: jest.fn(() => of('{"ok":true}')),
    };
    masking = {
      overview: jest.fn(() => of(overview('preview'))),
    };
    snack = { openSnackBar: jest.fn(), openError: jest.fn() };
    (fileUtils.saveRawAsFile as jest.Mock).mockClear();
    TestBed.configureTestingModule({
      imports: [cpTransloco()],
      providers: [
        ComplianceStore,
        { provide: DfComplianceApiService, useValue: api },
        { provide: DfDataMaskingApiService, useValue: masking },
        { provide: DfSnackbarService, useValue: snack },
      ],
    });
    store = TestBed.inject(ComplianceStore);
  });

  describe('load and select', () => {
    it('selects the requested baseline when it exists', () => {
      store.load('soc2');
      expect(store.selectedId).toBe('soc2');
      expect(api['get']).toHaveBeenCalledWith('soc2');
      expect(store.maskingMode).toBe('preview');
      // Only a peek for the turn-on option: never toasts on failure.
      expect(masking.overview).toHaveBeenCalledWith(true);
    });

    it('otherwise the first tracked one, else the first', () => {
      store.load('nope');
      expect(store.selectedId).toBe('pci_dss');
      api['list'].mockReturnValue(of([summary({ id: 'gdpr' })]));
      store.load(null);
      expect(store.selectedId).toBe('gdpr');
    });

    it('groups by vertical in catalog order', () => {
      store.load();
      expect(store.groups.map(g => g.vertical)).toEqual([
        'healthcare',
        'payments',
        'general',
      ]);
      expect(store.groups[2].baselines.map(b => b.id)).toEqual([
        'soc2',
        'iso27001',
      ]);
      expect(store.groups[0].icon).toBe('health_and_safety');
    });

    it('marks a failed list so the page can offer retry', () => {
      api['list'].mockReturnValue(throwError(() => ({ status: 500 })));
      store.load();
      expect(store.loadFailed).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.loadError).toBeNull();
    });

    it("keeps the server's reason when the list fails with one", () => {
      const notSetUp = normalizeError(
        new HttpErrorResponse({
          status: 503,
          error: {
            error: {
              code: 503,
              message:
                'Data Masking is not set up yet. Run: php artisan df:masking setup',
            },
          },
        })
      );
      api['list'].mockReturnValue(throwError(() => notSetUp));
      store.load();
      expect(store.loadError).toBe(
        'Data Masking is not set up yet. Run: php artisan df:masking setup'
      );
    });

    it('a slow detail for a baseline already left never fails the new one', () => {
      store.load('soc2');
      const slow = new Subject<BaselineDetail>();
      api['get']
        .mockReturnValueOnce(slow)
        .mockReturnValueOnce(of(detail({ id: 'hipaa' })));
      store.select('iso27001');
      store.select('hipaa');
      slow.error({ status: 500 });
      expect(store.detailFailed).toBe(false);
      expect(store.detail?.id).toBe('hipaa');
    });

    it('keeps the rail score in step with a fresh detail', () => {
      store.load('hipaa');
      const hipaa = store.baselines!.find(b => b.id === 'hipaa')!;
      // detail(): 1 pass, 2 fail, 1 manual, 1 n/a
      expect(hipaa.score.pass).toBe(1);
      expect(hipaa.score.fail).toBe(2);
      expect(hipaa.score.manual).toBe(1);
    });
  });

  describe('apply', () => {
    beforeEach(() => store.load('hipaa'));

    it('adopts, refreshes every score, and says so', () => {
      store.details.set('soc2', detail({ id: 'soc2' }));
      api['apply'].mockReturnValue(of(detail({ adopted: true, changes: [] })));
      store.apply('hipaa', false).subscribe();
      expect(api['apply']).toHaveBeenCalledWith('hipaa', false);
      // Settings are instance-wide: other cached checks are stale.
      expect(store.details.has('soc2')).toBe(false);
      expect(store.detail?.adopted).toBe(true);
      expect(api['list']).toHaveBeenCalledTimes(2);
      expect(masking.overview).toHaveBeenCalledTimes(2);
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'HIPAA baseline applied',
        'success'
      );
      expect(store.busy).toBeNull();
    });

    it('says masking is on when it was turned on too', () => {
      api['apply'].mockReturnValue(of(detail({ adopted: true })));
      store.apply('hipaa', true).subscribe();
      expect(api['apply']).toHaveBeenCalledWith('hipaa', true);
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'HIPAA baseline applied. Masking is on.',
        'success'
      );
    });

    it('on a never-scanned instance says the scan started, polls it, then re-reads the checks', fakeAsync(() => {
      masking.overview.mockReturnValue(
        of(overview('preview', { finishedAt: null, columns: 0 }))
      );
      store.load('hipaa');
      expect(store.neverScanned).toBe(true);
      expect(store.offerTurnOn).toBe(false);
      store.details.set('soc2', detail({ id: 'soc2' }));
      api['apply'].mockReturnValue(
        of({ ...detail({ adopted: true, changes: [] }), scanStarted: true })
      );
      // The server just started the scan.
      masking.overview.mockReturnValue(
        of(
          overview('preview', {
            status: 'running',
            progress: 40,
            finishedAt: null,
          })
        )
      );
      store.apply('hipaa', false).subscribe();
      expect(snack.openSnackBar).toHaveBeenCalledWith(
        'HIPAA baseline applied. Scanning…',
        'success'
      );
      expect(store.scanning).toBe(true);
      expect(store.scanProgress).toBe(40);
      expect(store.offerTurnOn).toBe(false);
      api['get'].mockClear();
      api['list'].mockClear();
      tick(SCAN_POLL_MS);
      expect(store.scanning).toBe(true);
      expect(api['get']).not.toHaveBeenCalled();
      // The scan finishes: the checks are read again.
      masking.overview.mockReturnValue(of(overview('preview')));
      tick(SCAN_POLL_MS);
      expect(store.scanning).toBe(false);
      expect(store.neverScanned).toBe(false);
      expect(store.offerTurnOn).toBe(true);
      expect(api['get']).toHaveBeenCalledWith('hipaa');
      expect(api['list']).toHaveBeenCalledTimes(1);
      const calls = masking.overview.mock.calls.length;
      tick(SCAN_POLL_MS * 3);
      expect(masking.overview.mock.calls.length).toBe(calls);
      discardPeriodicTasks();
    }));

    it('shows the scan Apply started even before the overview reports it running', fakeAsync(() => {
      masking.overview.mockReturnValue(
        of(overview('preview', { finishedAt: null, columns: 0 }))
      );
      store.load('hipaa');
      api['apply'].mockReturnValue(
        of({ ...detail({ adopted: true, changes: [] }), scanStarted: true })
      );
      store.apply('hipaa', false).subscribe();
      // The overview still says idle and never scanned: the scan is queued.
      expect(store.scanning).toBe(true);
      api['get'].mockClear();
      masking.overview.mockReturnValue(of(overview('preview')));
      tick(SCAN_POLL_MS);
      expect(store.scanning).toBe(false);
      expect(api['get']).toHaveBeenCalledWith('hipaa');
      discardPeriodicTasks();
    }));

    it('keeps what it had and toasts once on failure', () => {
      const before = store.detail;
      api['apply'].mockReturnValue(throwError(() => ({ status: 403 })));
      store.apply('hipaa', false).subscribe({ error: () => undefined });
      expect(store.detail).toBe(before);
      expect(snack.openError).toHaveBeenCalledTimes(1);
      expect(store.busy).toBeNull();
    });
  });

  describe('turning masking on', () => {
    it('is offered once a scan has finished and masking is not on', () => {
      store.load('hipaa');
      expect(store.offerTurnOn).toBe(true);
      masking.overview.mockReturnValue(of(overview('on')));
      store.load('hipaa');
      expect(store.offerTurnOn).toBe(false);
    });

    it('is not offered after a scan that found no columns (the server refuses On)', () => {
      masking.overview.mockReturnValue(
        of({
          ...overview('off', { columns: 0 }),
          counts: { masked: 0, review: 0, clear: 0 },
        })
      );
      store.load('hipaa');
      expect(store.neverScanned).toBe(true);
      expect(store.offerTurnOn).toBe(false);
    });

    it('is never offered before the first scan, or when masking is unknown', () => {
      masking.overview.mockReturnValue(
        of(overview('off', { finishedAt: null, columns: 0 }))
      );
      store.load('hipaa');
      expect(store.neverScanned).toBe(true);
      expect(store.offerTurnOn).toBe(false);
      masking.overview.mockReturnValue(throwError(() => ({ status: 503 })));
      store.load('hipaa');
      expect(store.offerTurnOn).toBe(false);
    });

    it('shows a scan already running when the page opens, and stops polling on destroy', fakeAsync(() => {
      masking.overview.mockReturnValue(
        of(overview('preview', { status: 'running', progress: null }))
      );
      store.load('hipaa');
      expect(store.scanning).toBe(true);
      expect(store.scanProgress).toBeNull();
      store.ngOnDestroy();
      const calls = masking.overview.mock.calls.length;
      tick(SCAN_POLL_MS * 2);
      expect(masking.overview.mock.calls.length).toBe(calls);
    }));
  });

  it('stop tracking clears the tracked state and reloads the checks', () => {
    api['get'].mockImplementation((id: string) =>
      of(detail({ id, name: 'PCI DSS', adopted: true }))
    );
    store.load('pci_dss');
    expect(store.selected?.adopted).toBe(true);
    api['get'].mockReset();
    api['get'].mockReturnValue(new Subject<BaselineDetail>());
    store.stopTracking('pci_dss');
    expect(api['stopTracking']).toHaveBeenCalledWith('pci_dss');
    expect(store.baselines!.find(b => b.id === 'pci_dss')!.adopted).toBe(false);
    expect(api['get']).toHaveBeenCalledWith('pci_dss');
    expect(snack.openSnackBar).toHaveBeenCalledWith(
      'Stopped tracking PCI DSS',
      'success'
    );
  });

  describe('export', () => {
    it('saves the report exactly as served, named by baseline and day', () => {
      store.exportReport('hipaa', 'json');
      const save = fileUtils.saveRawAsFile as jest.Mock;
      expect(api['report']).toHaveBeenCalledWith('hipaa', 'json');
      expect(save).toHaveBeenCalledTimes(1);
      const [text, name, type] = save.mock.calls[0];
      expect(text).toBe('{"ok":true}');
      expect(name).toMatch(
        /^dreamfactory-hipaa-baseline-\d{4}-\d{2}-\d{2}\.json$/
      );
      expect(type).toBe('json');
      expect(store.busy).toBeNull();
    });

    it('surfaces the server message from a text error body', () => {
      api['report'].mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 403,
              error: JSON.stringify({
                error: { code: 403, message: 'Not allowed' },
              }),
            })
        )
      );
      store.exportReport('hipaa', 'csv');
      expect(snack.openError).toHaveBeenCalledWith(
        expect.objectContaining({ status: 403, message: 'Not allowed' })
      );
      expect(fileUtils.saveRawAsFile).not.toHaveBeenCalled();
    });
  });

  describe('helpers', () => {
    it('scores pass and fail only', () => {
      expect(scoreOf(detail().controls)).toEqual({ pass: 1, checked: 3 });
      expect(scoreOf([control({ status: 'manual' })])).toEqual({
        pass: 0,
        checked: 0,
      });
    });

    it('turns a fix route into router commands, in-app only', () => {
      expect(fixLink('/api-security/data-masking?tab=access')).toEqual({
        path: '/api-security/data-masking',
        query: { tab: 'access' },
      });
      expect(fixLink('api-security/rate-limiting')).toEqual({
        path: '/api-security/rate-limiting',
        query: {},
      });
      expect(fixLink('#/system-settings/cors')).toEqual({
        path: '/system-settings/cors',
        query: {},
      });
      expect(fixLink('/dreamfactory/dist/#/admin-settings/admins')).toEqual({
        path: '/admin-settings/admins',
        query: {},
      });
      expect(fixLink('https://evil.example/x')).toBeNull();
      expect(fixLink('javascript:alert(1)')).toBeNull();
      expect(fixLink('//evil.example')).toBeNull();
      expect(fixLink('')).toBeNull();
      expect(fixLink(null)).toBeNull();
      expect(fixLink('/')).toBeNull();
    });

    it('leaves non-text errors alone', () => {
      const e = { status: 500 };
      expect(parseTextError(e)).toBe(e);
      const bad = new HttpErrorResponse({ status: 502, error: '<html>' });
      expect(parseTextError(bad)).toBe(bad);
      const html = normalizeError(bad);
      expect(parseTextError(html)).toBe(html);
    });

    it('reads the envelope out of an already-normalized text error', () => {
      const appError = normalizeError(
        new HttpErrorResponse({
          status: 404,
          url: '/api/v2/system/security_baseline/x/report',
          error: JSON.stringify({
            error: { code: 404, message: 'Baseline not found' },
          }),
        })
      );
      expect(appError.message).toBe('errors.http4xx');
      expect(parseTextError(appError)).toEqual(
        expect.objectContaining({ status: 404, message: 'Baseline not found' })
      );
    });
  });
});

// --------------------------------------------------------------------------
// Report download errors through the app's real interceptor chain (RU-10).
// --------------------------------------------------------------------------
describe('ComplianceStore export errors (real interceptors)', () => {
  it("shows the server's message when the evidence report fails", () => {
    const snack = { openSnackBar: jest.fn(), openError: jest.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [cpTransloco()],
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([caseInterceptor, errorInterceptor])
        ),
        provideHttpClientTesting(),
        ComplianceStore,
        DfComplianceApiService,
        { provide: DfSnackbarService, useValue: snack },
        {
          provide: DfUserDataService,
          useValue: { clearToken: jest.fn(), userData: null },
        },
        { provide: DfTrialService, useValue: { markLocked: jest.fn() } },
        {
          provide: DfDataMaskingApiService,
          useValue: { overview: jest.fn(() => of(overview('preview'))) },
        },
      ],
    });
    TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(ComplianceStore);
    store.exportReport('hipaa', 'csv');
    const req = http.expectOne(r =>
      r.url.includes('/security_baseline/hipaa/report')
    );
    // DreamFactory's JSON error envelope; responseType 'text' hands it to
    // the app as a string, and the error interceptor normalizes it first.
    req.flush(
      JSON.stringify({
        error: { code: 403, message: 'Not allowed to export this baseline' },
      }),
      { status: 403, statusText: 'Forbidden' }
    );
    expect(snack.openError).toHaveBeenCalledTimes(1);
    expect(snack.openError.mock.calls[0][0].message).toBe(
      'Not allowed to export this baseline'
    );
    expect(fileUtils.saveRawAsFile).not.toHaveBeenCalled();
    http.verify();
  });
});

describe('ComplianceStore writes refused with 403 (real interceptors)', () => {
  const MESSAGE =
    'Only a system administrator can change Compliance baselines.';
  let store: ComplianceStore;
  let http: HttpTestingController;
  let snack: { openSnackBar: jest.Mock; openError: jest.Mock };
  let user: { clearToken: jest.Mock; userData: null };

  beforeEach(() => {
    snack = { openSnackBar: jest.fn(), openError: jest.fn() };
    user = { clearToken: jest.fn(), userData: null };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [cpTransloco()],
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([caseInterceptor, errorInterceptor])
        ),
        provideHttpClientTesting(),
        ComplianceStore,
        DfComplianceApiService,
        { provide: DfSnackbarService, useValue: snack },
        { provide: DfUserDataService, useValue: user },
        { provide: DfTrialService, useValue: { markLocked: jest.fn() } },
        {
          provide: DfDataMaskingApiService,
          useValue: { overview: jest.fn(() => of(overview('preview'))) },
        },
      ],
    });
    TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(ComplianceStore);
    store.load('hipaa');
    http
      .expectOne(r => r.url.endsWith('/security_baseline'))
      .flush({ resource: [{ ...summary(), adopted: true }] });
    http
      .expectOne(r => r.url.endsWith('/security_baseline/hipaa'))
      .flush({ ...detail(), adopted: true });
  });

  afterEach(() => http.verify());

  const forbid = (method: string) =>
    http
      .expectOne(r => r.method === method)
      .flush(
        { error: { code: 403, message: MESSAGE, status_code: 403 } },
        { status: 403, statusText: 'Forbidden' }
      );

  const expectServerToast = () => {
    expect(snack.openError).toHaveBeenCalledTimes(1);
    expect(snack.openError.mock.calls[0][0].message).toBe(MESSAGE);
    expect(user.clearToken).not.toHaveBeenCalled();
    expect(snack.openSnackBar).not.toHaveBeenCalled();
  };

  it('apply: the checks and tracking stay as the server has them', () => {
    const before = store.detail;
    store.apply('hipaa', true).subscribe({ error: () => undefined });
    forbid('POST');
    expect(store.detail).toBe(before);
    expect(store.busy).toBeNull();
    expectServerToast();
  });

  it('stop tracking: still tracked', () => {
    store.stopTracking('hipaa');
    forbid('DELETE');
    expect(store.selected?.adopted).toBe(true);
    expect(store.baselines?.[0].adopted).toBe(true);
    expect(store.busy).toBeNull();
    expectServerToast();
  });
});
