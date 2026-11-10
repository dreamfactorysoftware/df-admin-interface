import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Translation, TranslocoTestingModule } from '@ngneat/transloco';
import { of, throwError } from 'rxjs';
import { DfSecurityOverviewComponent } from './df-security-overview.component';
import { SERVICE_TYPE_SERVICE_TOKEN } from '../shared/constants/tokens';
import { DfPaywallService } from '../shared/services/df-paywall.service';
import { DfSystemConfigDataService } from '../shared/services/df-system-config-data.service';
import { DfDataMaskingApiService } from '../adf-data-masking/data-masking-api.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ROOT: Translation = require('../../assets/i18n/en.json');

/** Security overview: Data Masking's status on its card (UC-14). */
describe('DfSecurityOverviewComponent masking status', () => {
  let fixture: ComponentFixture<DfSecurityOverviewComponent>;
  let overview: jest.Mock;
  let activatePaywall: jest.Mock;

  function create(license: string) {
    TestBed.configureTestingModule({
      imports: [
        DfSecurityOverviewComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: ROOT },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [
        provideRouter([]),
        {
          provide: SERVICE_TYPE_SERVICE_TOKEN,
          useValue: { getAll: () => of({ resource: [] }) },
        },
        {
          provide: DfSystemConfigDataService,
          useValue: { environment: { platform: { license } } },
        },
        {
          provide: DfPaywallService,
          useValue: {
            activatePaywall,
            isFeatureLocked: (route: string, l: string) =>
              l !== 'GOLD' && route.includes('data-masking'),
          },
        },
        { provide: DfDataMaskingApiService, useValue: { overview } },
      ],
    });
    fixture = TestBed.createComponent(DfSecurityOverviewComponent);
    fixture.detectChanges();
  }

  const maskingCard = () =>
    fixture.componentInstance.groups[0].cards.find(c =>
      c.route.endsWith('/data-masking')
    )!;
  const metaText = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a.section-card')
    )
      .find(a => a.getAttribute('aria-label') === 'Data Masking')
      ?.querySelector('.section-card__meta')
      ?.textContent?.trim();

  const ov = (
    mode: string,
    counts = { masked: 217, review: 29, clear: 3 }
  ) => ({
    mode,
    scan: { status: 'idle', finishedAt: '2026-10-29T06:00:00Z', columns: 249 },
    counts,
    you: { canGrant: true, seesRealValues: false },
  });

  beforeEach(() => {
    overview = jest.fn(() => of(ov('preview')));
    activatePaywall = jest.fn(() => of(false));
  });

  it('shows the mode and the review queue', () => {
    create('GOLD');
    expect(overview).toHaveBeenCalledWith(true);
    expect(maskingCard().meta).toBe('Preview · 29 to review');
    expect(metaText()).toBe('Preview · 29 to review');
  });

  it('On shows masked and to-review counts, disjoint', () => {
    overview.mockReturnValue(of(ov('on')));
    create('GOLD');
    expect(maskingCard().meta).toBe('On · 217 masked · 29 to review');
  });

  it('says when nothing has been scanned yet', () => {
    overview.mockReturnValue(
      of({
        ...ov('off'),
        scan: { status: 'idle', finishedAt: null, columns: 0 },
      })
    );
    create('GOLD');
    expect(maskingCard().meta).toBe('Not scanned');
  });

  it('a GOLD instance without the package is paywalled: no request, no status line', () => {
    activatePaywall.mockReturnValue(of(true));
    create('GOLD');
    expect(activatePaywall).toHaveBeenCalledWith('data_masking');
    expect(overview).not.toHaveBeenCalled();
    expect(maskingCard().meta).toBeUndefined();
    expect(metaText()).toBeUndefined();
  });

  it('open source looks as before: no request, no status line', () => {
    create('OPEN SOURCE');
    expect(activatePaywall).not.toHaveBeenCalled();
    expect(overview).not.toHaveBeenCalled();
    expect(maskingCard().meta).toBeUndefined();
    expect(metaText()).toBeUndefined();
  });

  it('a failed read leaves the card as before', () => {
    overview.mockReturnValue(throwError(() => ({ status: 403 })));
    create('GOLD');
    expect(maskingCard().meta).toBeUndefined();
  });

  it('lists AAuth after Authentication, in nav order, four to a row', () => {
    create('GOLD');
    const cards = fixture.componentInstance.groups[0].cards;
    expect(cards.map(c => c.route)).toEqual([
      '/api-security/authentication',
      '/api-security/aauth',
      '/api-security/rate-limiting',
      '/api-security/data-masking',
      '/api-security/compliance',
      '/api-connections/role-based-access',
      '/api-connections/api-keys',
    ]);
    const link = (fixture.nativeElement as HTMLElement).querySelector(
      'a.section-card[aria-label="AAuth"]'
    );
    expect(link?.getAttribute('href')).toBe('/api-security/aauth');
    expect(link?.textContent).toContain('Manage AAuth');
    // No status line and no request of its own.
    expect(cards[1].meta).toBeUndefined();
    expect(activatePaywall).not.toHaveBeenCalledWith('aauth');
    const grid = (fixture.nativeElement as HTMLElement).querySelector(
      '.section-landing__cards--fixed'
    ) as HTMLElement | null;
    expect(grid?.style.getPropertyValue('--section-landing-card-cols')).toBe(
      '4'
    );
  });
});
