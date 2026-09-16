import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { DfAccessUsageCellComponent } from './df-access-usage-cell.component';
import { AccessUsageRow } from '../../types/access-usage';

const DAY = 86_400_000;
const dfDate = (msAgo: number) =>
  new Date(Date.now() - msAgo).toISOString().replace('T', ' ').slice(0, 19);

const row = (overrides: Partial<AccessUsageRow> = {}): AccessUsageRow => ({
  subjectType: 'app',
  subjectId: 1,
  name: 'key',
  isActive: true,
  lastUsedAt: null,
  lastDeniedAt: null,
  lastService: null,
  lastStatus: null,
  neverUsed: false,
  stale: false,
  disabledButAttempted: false,
  roleUnreferenced: null,
  lastLoginDate: null,
  isSysAdmin: null,
  requests30d: null,
  topServices: null,
  ...overrides,
});

// Subset of src/assets/i18n/en.json used by the cell.
const en = {
  accessUsage: {
    never: 'Never',
    unreferenced: 'Unreferenced',
    disabledButAttempted: 'Inactive, but clients are still sending it',
    tooltip: {
      lastUsed: 'Last used {{at}}',
      lastUsedOn: 'Last used on {{service}} (HTTP {{status}})',
      lastUsedOnService: 'Last used on {{service}}',
      neverUsed: 'No use recorded',
      neverUsedSince: 'No use recorded since {{since}}',
      lastDenied: 'Last denied {{at}}',
      disabledButAttempted: 'Inactive, but clients are still sending it',
      stale: 'Stale: not used in the last {{days}} days',
      unreferenced: 'No API key, user, or auth provider references this role',
    },
  },
};

describe('DfAccessUsageCellComponent', () => {
  let fixture: ComponentFixture<DfAccessUsageCellComponent>;
  let el: HTMLElement;

  const render = (
    usage: AccessUsageRow | undefined,
    inputs: { staleDays?: number; trackingStartedAt?: string } = {}
  ) => {
    fixture.componentRef.setInput('usage', usage);
    fixture.componentRef.setInput('staleDays', inputs.staleDays ?? 90);
    fixture.componentRef.setInput(
      'trackingStartedAt',
      inputs.trackingStartedAt ?? null
    );
    fixture.detectChanges();
  };
  const q = (selector: string) => el.querySelector(selector);
  const label = () => q('.df-usage__label')?.textContent?.trim();
  const tooltipLines = () => fixture.componentInstance.tooltip.split('\n');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        DfAccessUsageCellComponent,
        NoopAnimationsModule,
        TranslocoTestingModule.forRoot({
          langs: { en },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
    });
    fixture = TestBed.createComponent(DfAccessUsageCellComponent);
    el = fixture.nativeElement;
  });

  it('shows "Never", muted, when there is no record', () => {
    render(undefined);
    expect(label()).toBe('Never');
    expect(q('.df-usage--muted')).not.toBeNull();
    expect(q('[data-testid="access-usage-warning"]')).toBeNull();
    expect(q('[data-testid="access-usage-unreferenced"]')).toBeNull();
    expect(fixture.componentInstance.tooltip).toBe('No use recorded');
  });

  it('says since when tracking started for a never-used subject', () => {
    render(row({ neverUsed: true }), {
      trackingStartedAt: '2026-06-01 00:00:00',
    });
    expect(label()).toBe('Never');
    expect(tooltipLines()).toHaveLength(1);
    expect(tooltipLines()[0]).toMatch(/^No use recorded since .+/);
  });

  it('shows relative time for a recently used subject', () => {
    render(row({ lastUsedAt: dfDate(3 * DAY + 60_000), lastService: 'db' }));
    expect(label()).toBe('3 days ago');
    expect(q('.df-usage--muted')).toBeNull();
    expect(tooltipLines()).toHaveLength(2);
    expect(tooltipLines()[0]).toMatch(/^Last used .+/);
    expect(tooltipLines()[1]).toBe('Last used on db');
  });

  it('mutes a stale subject and names the window', () => {
    render(row({ lastUsedAt: dfDate(120 * DAY), stale: true }));
    expect(q('.df-usage--muted')).not.toBeNull();
    expect(tooltipLines()).toContain('Stale: not used in the last 90 days');
  });

  it('warns when an inactive credential is still being sent', () => {
    render(
      row({
        isActive: false,
        disabledButAttempted: true,
        lastDeniedAt: dfDate(DAY),
      })
    );
    expect(q('[data-testid="access-usage-warning"]')).not.toBeNull();
    expect(q('.cdk-visually-hidden')?.textContent?.trim()).toBe(
      'Inactive, but clients are still sending it'
    );
    expect(tooltipLines()[0]).toBe(
      'Inactive, but clients are still sending it'
    );
  });

  it('badges an unreferenced role', () => {
    render(row({ subjectType: 'role', roleUnreferenced: true }));
    expect(
      q('[data-testid="access-usage-unreferenced"]')?.textContent?.trim()
    ).toBe('Unreferenced');
  });
});
