import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { DfTrialBannerComponent } from './df-trial-banner.component';
import { DfTrialService } from '../../services/df-trial.service';
import { TrialInfo, TrialRemaining } from '../../types/trial';
import { splitTrialRemaining } from '../../utilities/trial';

// Real copy from src/assets/i18n/en.json so the spec guards the section-9 text.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

const DAY = 86400;

const TRIAL: TrialInfo = {
  status: 'active',
  trialId: 'trl_01TEST',
  email: 'user@company.com',
  plan: 'gold-trial',
  startedAt: '2026-10-03T20:00:00+00:00',
  expiresAt: '2026-11-02T20:00:00+00:00',
  daysRemaining: 30,
  secondsRemaining: 29 * DAY + 4 * 3600,
  warnDays: 7,
  criticalDays: 3,
  contactEmail: 'sales@dreamfactory.com',
  demoUrl: 'https://www.dreamfactory.com/demo',
  portalUrl: 'https://portal.dreamfactory.com',
  version: '7.7.1',
};

describe('DfTrialBannerComponent', () => {
  let fixture: ComponentFixture<DfTrialBannerComponent>;
  const trial$ = new BehaviorSubject<TrialInfo | null>(null);
  const remaining$ = new BehaviorSubject<TrialRemaining | null>(null);
  const expired$ = new BehaviorSubject<boolean>(false);

  const banner = () =>
    fixture.debugElement.query(By.css('[data-testid="trial-banner"]'));
  const text = (selector: string) =>
    fixture.debugElement
      .query(By.css(selector))
      .nativeElement.textContent.replace(/\s+/g, ' ')
      .trim();

  async function render() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    trial$.next(null);
    remaining$.next(null);
    expired$.next(false);
    await TestBed.configureTestingModule({
      imports: [DfTrialBannerComponent],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        {
          provide: DfTrialService,
          useValue: { trial$, remaining$, expired$ },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DfTrialBannerComponent);
  });

  it('renders nothing on a non-trial install', async () => {
    await render();
    expect(banner()).toBeNull();
    expect(fixture.debugElement.query(By.css('.banner-spacer'))).toBeNull();
  });

  it('shows the section-9 copy with the live countdown and both CTAs', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(29 * DAY + 4 * 3600 + 7, 7, 3));
    await render();

    expect(banner()).not.toBeNull();
    expect(banner().attributes['data-severity']).toBe('info');
    expect(banner().classes['trial-banner--info']).toBe(true);
    expect(text('.banner-label')).toBe('Trial license');
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '29 days, 4 hours remaining'
    );
    expect(text('.banner-help')).toBe(
      'Need more time? Contact sales@dreamfactory.com or book time at dreamfactory.com/demo.'
    );
    expect(text('.banner-text')).toBe(
      'Trial license · 29 days, 4 hours remaining · Need more time? Contact sales@dreamfactory.com or book time at dreamfactory.com/demo.'
    );

    const contact = fixture.debugElement.query(
      By.css('[data-testid="trial-contact-cta"]')
    );
    const demo = fixture.debugElement.query(
      By.css('[data-testid="trial-demo-cta"]')
    );
    expect(contact.nativeElement.getAttribute('href')).toBe(
      'mailto:sales@dreamfactory.com'
    );
    expect(demo.nativeElement.getAttribute('href')).toBe(
      'https://www.dreamfactory.com/demo'
    );
    expect(demo.nativeElement.getAttribute('target')).toBe('_blank');
    expect(demo.nativeElement.getAttribute('rel')).toBe('noopener');
    // the spacer pushes the shell down exactly like the engagement banner
    expect(fixture.debugElement.query(By.css('.banner-spacer'))).not.toBeNull();
  });

  it('re-renders the countdown on every tick', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(29 * DAY + 4 * 3600, 7, 3));
    await render();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '29 days, 4 hours remaining'
    );
    remaining$.next(splitTrialRemaining(29 * DAY + 3 * 3600 + 59 * 60, 7, 3));
    fixture.detectChanges();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '29 days, 3 hours remaining'
    );
  });

  it('pluralises units: "1 day, 1 hour" and "0 days, 1 hour"', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(DAY + 3600 + 5, 7, 3));
    await render();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '1 day, 1 hour remaining'
    );
    remaining$.next(splitTrialRemaining(3600 + 5, 7, 3));
    fixture.detectChanges();
    expect(text('[data-testid="trial-countdown"]')).toBe(
      '0 days, 1 hour remaining'
    );
  });

  it('escalates to the warning and critical colour states', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(6 * DAY, 7, 3));
    await render();
    expect(banner().attributes['data-severity']).toBe('warning');
    expect(banner().classes['trial-banner--warning']).toBe(true);
    expect(banner().classes['trial-banner--info']).toBeFalsy();

    remaining$.next(splitTrialRemaining(2 * DAY, 7, 3));
    fixture.detectChanges();
    expect(banner().attributes['data-severity']).toBe('critical');
    expect(banner().classes['trial-banner--critical']).toBe(true);
    expect(banner().classes['trial-banner--warning']).toBeFalsy();
  });

  it('hides while the instance is locked (the expired page is the message)', async () => {
    trial$.next(TRIAL);
    remaining$.next(splitTrialRemaining(29 * DAY, 7, 3));
    await render();
    expect(banner()).not.toBeNull();

    expired$.next(true);
    fixture.detectChanges();
    expect(banner()).toBeNull();
  });

  it('hides when the trial block itself is not active', async () => {
    trial$.next({ ...TRIAL, status: 'expired' });
    remaining$.next(splitTrialRemaining(0, 7, 3));
    await render();
    expect(banner()).toBeNull();
  });

  it('falls back to the section-9 contact and demo constants when the block omits them', async () => {
    trial$.next({ ...TRIAL, contactEmail: '', demoUrl: '' });
    remaining$.next(splitTrialRemaining(10 * DAY, 7, 3));
    await render();
    expect(
      fixture.debugElement
        .query(By.css('[data-testid="trial-contact-cta"]'))
        .nativeElement.getAttribute('href')
    ).toBe('mailto:sales@dreamfactory.com');
    expect(
      fixture.debugElement
        .query(By.css('[data-testid="trial-demo-cta"]'))
        .nativeElement.getAttribute('href')
    ).toBe('https://www.dreamfactory.com/demo');
  });
});
