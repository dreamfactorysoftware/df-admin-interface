import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';
import {
  Translation,
  TranslocoLoader,
  provideTransloco,
} from '@ngneat/transloco';
import { DfTrialExpiredComponent } from './df-trial-expired.component';
import { DfTrialService } from '../../services/df-trial.service';
import { TrialInfo, TrialLock } from '../../types/trial';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EN: Translation = require('../../../../assets/i18n/en.json');

@Injectable()
class InlineLoader implements TranslocoLoader {
  getTranslation() {
    return of(EN);
  }
}

describe('DfTrialExpiredComponent', () => {
  let fixture: ComponentFixture<DfTrialExpiredComponent>;
  const lock$ = new BehaviorSubject<TrialLock | null>(null);
  const trial$ = new BehaviorSubject<TrialInfo | null>(null);

  const text = (testId: string) =>
    fixture.debugElement
      .query(By.css(`[data-testid="${testId}"]`))
      ?.nativeElement.textContent.replace(/\s+/g, ' ')
      .trim();
  const href = (testId: string) =>
    fixture.debugElement
      .query(By.css(`[data-testid="${testId}"]`))
      ?.nativeElement.getAttribute('href');

  async function render() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    lock$.next(null);
    trial$.next(null);
    await TestBed.configureTestingModule({
      imports: [DfTrialExpiredComponent],
      providers: [
        provideTransloco({
          config: { defaultLang: 'en', availableLangs: ['en'] },
          loader: InlineLoader,
        }),
        { provide: DfTrialService, useValue: { lock$, trial$ } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DfTrialExpiredComponent);
  });

  it('renders the TRIAL_EXPIRED thank-you copy, the ended-on date and both CTAs', async () => {
    lock$.next({
      reason: 'TRIAL_EXPIRED',
      context: {
        reason: 'TRIAL_EXPIRED',
        trial_id: 'trl_01TEST',
        expired_at: '2026-11-02T20:00:00+00:00',
        contact_email: 'sales@dreamfactory.com',
        demo_url: 'https://www.dreamfactory.com/demo',
        portal_url: 'https://portal.dreamfactory.com',
      },
    });
    await render();

    const root = fixture.debugElement.query(
      By.css('[data-testid="trial-expired"]')
    );
    expect(root.attributes['data-reason']).toBe('TRIAL_EXPIRED');
    expect(root.classes['trial-expired--invalid']).toBeFalsy();
    expect(text('trial-expired-title')).toBe(
      'Thank you for testing DreamFactory.'
    );
    expect(text('trial-expired-lead')).toBe(
      'Your 30-day trial has ended. To continue using the platform, contact us at sales@dreamfactory.com or book a time at dreamfactory.com/demo.'
    );
    expect(text('trial-expired-ended-on')).toMatch(
      /^Your 30-day trial ended on November \d, 2026\.$/
    );
    expect(href('trial-expired-contact-cta')).toBe(
      'mailto:sales@dreamfactory.com'
    );
    expect(text('trial-expired-contact-cta')).toBe(
      'Email sales@dreamfactory.com'
    );
    expect(href('trial-expired-demo-cta')).toBe(
      'https://www.dreamfactory.com/demo'
    );
    expect(href('trial-expired-portal-cta')).toBeUndefined();
  });

  it('renders the TRIAL_TOKEN_INVALID variant with the portal CTA and no ended-on line', async () => {
    lock$.next({
      reason: 'TRIAL_TOKEN_INVALID',
      context: { reason: 'TRIAL_TOKEN_INVALID', detail: 'missing_token' },
    });
    await render();

    const root = fixture.debugElement.query(
      By.css('[data-testid="trial-expired"]')
    );
    expect(root.attributes['data-reason']).toBe('TRIAL_TOKEN_INVALID');
    expect(root.classes['trial-expired--invalid']).toBe(true);
    expect(text('trial-expired-title')).toBe(
      'This DreamFactory trial instance needs a valid trial token.'
    );
    expect(text('trial-expired-lead')).toContain('Copy DF_TRIAL_TOKEN');
    expect(text('trial-expired-ended-on')).toBeUndefined();
    // section-9 defaults when the 403 context carries no urls
    expect(href('trial-expired-contact-cta')).toBe(
      'mailto:sales@dreamfactory.com'
    );
    expect(href('trial-expired-demo-cta')).toBe(
      'https://www.dreamfactory.com/demo'
    );
    expect(href('trial-expired-portal-cta')).toBe(
      'https://portal.dreamfactory.com'
    );
  });

  it('falls back to the trial block for the end date when the lock context has none', async () => {
    trial$.next({
      status: 'active',
      trialId: 'trl_FROM_ENV',
      email: null,
      plan: 'gold-trial',
      startedAt: '2026-10-03T20:00:00+00:00',
      expiresAt: '2026-10-20T12:00:00+00:00',
      daysRemaining: 0,
      secondsRemaining: 0,
      warnDays: 7,
      criticalDays: 3,
      contactEmail: 'sales@dreamfactory.com',
      demoUrl: 'https://www.dreamfactory.com/demo',
      portalUrl: 'https://portal.dreamfactory.com',
      version: '7.7.1',
    });
    lock$.next({
      reason: 'TRIAL_EXPIRED',
      context: { reason: 'TRIAL_EXPIRED' },
    });
    await render();
    expect(text('trial-expired-ended-on')).toMatch(/October \d+, 2026/);
  });
});
