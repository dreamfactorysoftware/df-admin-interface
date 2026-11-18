/**
 * A 403 on any Data Masking write (a restricted admin, an admin who is not
 * the super admin, an AI session) runs through the real HTTP pipeline (case
 * and error interceptors, the API service) and must show the server's own
 * message in one error toast, never sign the admin out, and leave the screen
 * as the server has it.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { caseInterceptor } from 'src/app/shared/interceptors/case.interceptor';
import { errorInterceptor } from 'src/app/shared/interceptors/error.interceptor';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { DfTrialService } from 'src/app/shared/services/df-trial.service';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfDataMaskingApiService } from './data-masking-api.service';
import { DataMaskingStore, summarize } from './data-masking.store';
import { DmUndoToastService } from './df-dm-undo-toast/df-dm-undo-toast.component';
import { column, dmTransloco } from './dm-testing';
import {
  AccessSettings,
  DetectionRule,
  MaskedColumn,
  MaskingOverview,
} from './data-masking.types';

const MESSAGE = 'Only a system administrator can change Data Masking settings.';

const overview = (over: Partial<MaskingOverview> = {}): MaskingOverview => ({
  mode: 'on',
  scan: { status: 'idle', columns: 2, finishedAt: '2026-10-28T00:00:00Z' },
  counts: { masked: 1, review: 1, clear: 0 },
  you: { canGrant: true, seesRealValues: false },
  ...over,
});

describe('DataMaskingStore: a 403 on any write', () => {
  let store: DataMaskingStore;
  let http: HttpTestingController;
  let snack: { openSnackBar: jest.Mock; openError: jest.Mock };
  let user: { clearToken: jest.Mock; userData: null };
  let navigate: jest.SpyInstance;

  beforeEach(() => {
    snack = { openSnackBar: jest.fn(), openError: jest.fn() };
    user = { clearToken: jest.fn(), userData: null };
    TestBed.configureTestingModule({
      imports: [dmTransloco()],
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([caseInterceptor, errorInterceptor])
        ),
        provideHttpClientTesting(),
        DataMaskingStore,
        DfDataMaskingApiService,
        { provide: DfSnackbarService, useValue: snack },
        { provide: DmUndoToastService, useValue: { open: jest.fn() } },
        { provide: DfUserDataService, useValue: user },
        { provide: DfTrialService, useValue: { markLocked: jest.fn() } },
      ],
    });
    TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    navigate = jest.spyOn(TestBed.inject(Router), 'navigate');
    store = TestBed.inject(DataMaskingStore);
    store.overview = overview();
  });

  /** DreamFactory's error envelope for a refused write. */
  const forbid = (req: TestRequest, message = MESSAGE) =>
    req.flush(
      { error: { code: 403, message, status_code: 403 } },
      { status: 403, statusText: 'Forbidden' }
    );

  const expectServerToast = (message = MESSAGE) => {
    expect(snack.openError).toHaveBeenCalledTimes(1);
    expect(snack.openError.mock.calls[0][0].message).toBe(message);
    expect(snack.openError.mock.calls[0][0].status).toBe(403);
    // Forbidden is not signed out: no token cleared, no trip to login.
    expect(user.clearToken).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  };

  const seed = (): MaskedColumn[] => {
    const list = [
      column({
        id: 'crm.a.dob',
        service: 'crm',
        table: 'a',
        column: 'dob',
        verdict: 'review',
        class: 'date_of_birth',
        tier: 'identity',
      }),
      column({ id: 'crm.a.ssn', service: 'crm', table: 'a', column: 'ssn' }),
    ];
    store.columns.set('crm', list);
    store.services = [
      { service: 'crm', label: 'CRM', tables: [summarize('a', list)] },
    ];
    return list;
  };

  afterEach(() => http.verify({ ignoreCancelled: true }));

  it('mode: back to the mode it had', () => {
    store.setMode('preview');
    expect(store.overview?.mode).toBe('preview');
    forbid(
      http.expectOne(r => r.method === 'PATCH'),
      'Only the super admin can lower the masking mode.'
    );
    expect(store.overview?.mode).toBe('on');
    expect(store.modeSaving).toBe(false);
    expectServerToast('Only the super admin can lower the masking mode.');
  });

  it('scan: no scan shown as running', () => {
    store.scan();
    forbid(http.expectOne(r => r.url.endsWith('/data_masking/scan')));
    expect(store.scanning).toBe(false);
    expectServerToast();
  });

  it('column decision: the column, the rail and the counts as they were', () => {
    const [dob] = seed();
    store.decide(dob, null);
    expect(store.counts.review).toBe(0);
    forbid(
      http.expectOne(r => r.url.endsWith('/data_masking/column')),
      'Only a system administrator can mark a column not sensitive.'
    );
    const now = store.columns.get('crm')![0];
    expect(now.verdict).toBe('review');
    expect(now.class).toBe('date_of_birth');
    expect(store.counts.review).toBe(1);
    expect(store.services[0].tables[0].columns.review).toBe(1);
    expectServerToast(
      'Only a system administrator can mark a column not sensitive.'
    );
  });

  it('access: the confirmed settings come back and the view drops its choice', () => {
    const confirmed: AccessSettings = {
      admins: { mode: 'none', grants: [], available: [] },
      ai: 'masked',
      roles: [],
      version: 'v1',
    };
    store.loadAccess();
    http.expectOne(r => r.method === 'GET').flush(confirmed);
    const onError = jest.fn();
    store.updateAccess(
      { ai: 'same_as_admins' },
      { ...confirmed, ai: 'same_as_admins' },
      onError
    );
    forbid(
      http.expectOne(r => r.method === 'PATCH'),
      'Only the super admin can give access.'
    );
    expect(store.access?.ai).toBe('masked');
    expect(onError).toHaveBeenCalled();
    expectServerToast('Only the super admin can give access.');
  });

  it('mask format: the formats as they were', () => {
    store.loadMasks();
    http
      .expectOne(r => r.method === 'GET')
      .flush({
        resource: [
          {
            class: 'email',
            tier: 'identity',
            format: 'initial',
            formats_allowed: ['initial', 'redact'],
          },
        ],
      });
    store.setMask('email', 'redact');
    expect(store.masks![0].format).toBe('redact');
    forbid(http.expectOne(r => r.method === 'PATCH'));
    expect(store.masks![0].format).toBe('initial');
    expectServerToast();
  });

  it('add rule: the toast carries the message; the rule list is unchanged', () => {
    store.rules = [];
    let failed = false;
    store
      .addRule({ match: 'name', pattern: '^emp_ssn$', class: 'national_id' })
      .subscribe({ error: () => (failed = true) });
    forbid(http.expectOne(r => r.url.endsWith('/data_masking/rule')));
    expect(failed).toBe(true);
    expect(store.rules).toEqual([]);
    expectServerToast();
  });

  it('delete rule: the rule comes back', () => {
    const rule: DetectionRule = {
      id: 7,
      match: 'name',
      pattern: '^emp_ssn$',
      class: 'national_id',
      matches: 0,
    };
    store.rules = [rule];
    store.deleteRule(rule);
    expect(store.rules).toEqual([]);
    forbid(http.expectOne(r => r.method === 'DELETE'));
    expect(store.rules).toEqual([rule]);
    expectServerToast();
  });

  it('delete and unmask: when unmasking is refused, the server says why', () => {
    const [, ssn] = seed();
    const rule: DetectionRule = {
      id: 7,
      match: 'name',
      pattern: '^ssn$',
      class: 'national_id',
      matches: 1,
    };
    store.rules = [rule];
    store.deleteRule(rule, [ssn]);
    http.expectOne(r => r.method === 'DELETE').flush({ id: 7 });
    forbid(
      http.expectOne(r => r.url.endsWith('/data_masking/column')),
      'Only a system administrator can mark a column not sensitive.'
    );
    expectServerToast(
      'Only a system administrator can mark a column not sensitive.'
    );
    // Not the generic "Unmasked 0 of 1 columns".
    expect(snack.openSnackBar).not.toHaveBeenCalled();
    // The page re-reads what the server now has.
    expect(http.match(r => r.method === 'GET').length).toBeGreaterThan(0);
  });
});
