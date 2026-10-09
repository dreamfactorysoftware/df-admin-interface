import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { DfLicenseInitializerService } from './df-license-initializer.service';
import { DfLicenseCheckService } from './df-license-check.service';
import { DfSystemConfigDataService } from './df-system-config-data.service';
import { Environment } from '../types/system';
import { TrialInfo } from '../types/trial';

const BASE_ENV: Environment = {
  authentication: {
    allowOpenRegistration: false,
    openRegEmailServiceId: 0,
    allowForeverSessions: false,
    loginAttribute: 'email',
    adldap: [],
    oauth: [],
    saml: [],
  },
  server: { host: '', machine: '', release: '', serverOs: '', version: '' },
};

const TRIAL: TrialInfo = {
  status: 'active',
  trialId: 'trl_01TEST',
  email: null,
  plan: 'gold-trial',
  startedAt: null,
  expiresAt: '2026-11-02T20:00:00+00:00',
  daysRemaining: 30,
  secondsRemaining: 30 * 86400,
  warnDays: 7,
  criticalDays: 3,
  contactEmail: 'sales@dreamfactory.com',
  demoUrl: 'https://www.dreamfactory.com/demo',
  portalUrl: 'https://portal.dreamfactory.com',
  version: '7.7.1',
};

describe('DfLicenseInitializerService', () => {
  const environment$ = new BehaviorSubject<Environment>(BASE_ENV);
  const licenseCheckService = {
    currentLicenseCheck: null,
    check: jest.fn(() =>
      of({
        disableUi: 'false',
        msg: 'Paid',
        renewalDate: '',
        statusCode: '200',
      })
    ),
  };
  let service: DfLicenseInitializerService;

  beforeEach(() => {
    licenseCheckService.check.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: DfLicenseCheckService, useValue: licenseCheckService },
        {
          provide: DfSystemConfigDataService,
          useValue: { environment$: environment$.asObservable() },
        },
      ],
    });
    service = TestBed.inject(DfLicenseInitializerService);
  });

  it('still calls updates.dreamfactory.com for a keyed paid license', done => {
    environment$.next({
      ...BASE_ENV,
      platform: {
        license: 'GOLD',
        licenseKey: 'abc',
      } as Environment['platform'],
    });
    service.initializeLicenseCheck().subscribe(result => {
      expect(result).toBe(true);
      expect(licenseCheckService.check).toHaveBeenCalledWith('abc');
      done();
    });
  });

  it('skips the remote check on a Docker trial (offline-safe), logged in or not', done => {
    environment$.next({
      ...BASE_ENV,
      platform: {
        license: 'GOLD',
        licenseKey: false,
        trial: TRIAL,
      } as Environment['platform'],
    });
    service.initializeLicenseCheck().subscribe(result => {
      expect(result).toBe(true);
      expect(licenseCheckService.check).not.toHaveBeenCalled();

      environment$.next({ ...BASE_ENV, trial: TRIAL });
      service.initializeLicenseCheck().subscribe(r2 => {
        expect(r2).toBe(true);
        expect(licenseCheckService.check).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
