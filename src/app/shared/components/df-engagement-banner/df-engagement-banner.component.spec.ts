import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { TranslocoService, provideTransloco } from '@ngneat/transloco';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslocoHttpLoader } from 'src/transloco-loader';
import { DfEngagementBannerComponent } from './df-engagement-banner.component';
import { DfSystemConfigDataService } from '../../services/df-system-config-data.service';
import { Environment } from '../../types/system';
import { TrialInfo } from '../../types/trial';

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

describe('DfEngagementBannerComponent', () => {
  let fixture: ComponentFixture<DfEngagementBannerComponent>;
  const environment$ = new BehaviorSubject<Environment>(BASE_ENV);

  const banner = () => fixture.debugElement.query(By.css('.engagement-banner'));

  beforeEach(() => {
    environment$.next(BASE_ENV);
    TestBed.configureTestingModule({
      imports: [DfEngagementBannerComponent, HttpClientTestingModule],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: TranslocoHttpLoader,
        }),
        TranslocoService,
        {
          provide: DfSystemConfigDataService,
          useValue: { environment$: environment$.asObservable() },
        },
      ],
    });
    fixture = TestBed.createComponent(DfEngagementBannerComponent);
  });

  it('shows for Open Source installs', () => {
    environment$.next({
      ...BASE_ENV,
      platform: { license: 'OPEN SOURCE' } as Environment['platform'],
    });
    fixture.detectChanges();
    expect(banner()).not.toBeNull();
  });

  it('shows for the legacy hosted isTrial flag without a trial block', () => {
    environment$.next({
      ...BASE_ENV,
      platform: { license: 'GOLD', isTrial: true } as Environment['platform'],
    });
    fixture.detectChanges();
    expect(banner()).not.toBeNull();
  });

  it('hides on Docker trial instances so it never stacks under <df-trial-banner>', () => {
    environment$.next({
      ...BASE_ENV,
      platform: {
        license: 'GOLD',
        isTrial: true,
        trial: TRIAL,
      } as Environment['platform'],
    });
    fixture.detectChanges();
    expect(banner()).toBeNull();

    // pre-login shape: top-level trial, no platform
    environment$.next({ ...BASE_ENV, trial: TRIAL });
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });

  it('hides for paid licenses', () => {
    environment$.next({
      ...BASE_ENV,
      platform: { license: 'GOLD', isTrial: false } as Environment['platform'],
    });
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });
});
