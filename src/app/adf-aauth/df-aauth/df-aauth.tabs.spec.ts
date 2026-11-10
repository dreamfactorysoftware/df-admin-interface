import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfAauthComponent } from './df-aauth.component';
import { DfAauthApiService } from '../aauth-api.service';
import { ISSUER, aauthTransloco } from '../aauth-testing';
import { fakeAauthApi } from '../aauth-testing-api';
import { ActivityRow } from '../aauth.types';

/** The fake's jest.fn types are inferred from its defaults; widen for overrides. */
const mock = (fn: unknown) => fn as jest.Mock;

/** The list tabs (Agents, Activity, Grants, Person Servers) inside the shell. */
describe('DfAauthComponent list tabs', () => {
  let fixture: ComponentFixture<DfAauthComponent>;
  let api: ReturnType<typeof fakeAauthApi>;
  let router: Router;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (id: string) => el().querySelector(`[data-testid="${id}"]`);
  const qa = (id: string) => el().querySelectorAll(`[data-testid="${id}"]`);

  const host = new URL(ISSUER).host;
  const activityRow = (over: Partial<ActivityRow>): ActivityRow => ({
    id: 1,
    createdAt: new Date().toISOString(),
    agentId: `aauth:playground@${host}`,
    agentName: 'DreamFactory Playground',
    person: null,
    psIssuer: null,
    scope: null,
    method: 'GET',
    path: '/api/v2/sales/_table/orders',
    status: 401,
    outcome: 'error',
    detail: null,
    ...over,
  });

  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function open(tab: string) {
    fixture = TestBed.createComponent(DfAauthComponent);
    await router.navigate([], { queryParams: { tab } });
    await settle();
  }

  beforeEach(() => {
    api = fakeAauthApi();
    TestBed.configureTestingModule({
      imports: [DfAauthComponent, aauthTransloco(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: DfAauthApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    }).overrideProvider(MatDialog, {
      useValue: { open: jest.fn(() => ({ afterClosed: () => of(false) })) },
    });
    router = TestBed.inject(Router);
  });

  describe('Activity', () => {
    it('filters by result with one control, asking the server for those outcomes', async () => {
      await open('activity');
      const filters = Array.from(
        el().querySelectorAll('[data-testid="aa-activity-filters"] button')
      );
      expect(filters.map(b => b.textContent?.trim())).toEqual([
        'All',
        'Allowed',
        'Needs approval',
        'Rejected',
      ]);
      expect(filters[0].getAttribute('aria-pressed')).toBe('true');
      expect(api.activity).toHaveBeenLastCalledWith(100, undefined, false, []);

      (q('aa-activity-filter-approval') as HTMLButtonElement).click();
      await settle();
      expect(api.activity).toHaveBeenLastCalledWith(100, undefined, false, [
        'person_required',
        'auth_required',
      ]);
      expect(
        q('aa-activity-filter-approval')?.getAttribute('aria-pressed')
      ).toBe('true');
      expect(q('aa-activity-filter-all')?.getAttribute('aria-pressed')).toBe(
        'false'
      );
    });

    it('reads a failure reason on its own line: sentence, then code', async () => {
      mock(api.activity).mockReturnValue(
        of({
          hasMore: false,
          rows: [
            activityRow({
              id: 2,
              detail: 'invalid_signature: HTTP message signature is invalid',
            }),
            activityRow({
              id: 1,
              outcome: 'auth_required',
              scope: 'sales.refund',
              detail: 'step-up',
            }),
          ],
        })
      );
      await open('activity');
      const reasons = Array.from(qa('aa-activity-detail'));
      expect(reasons.length).toBe(2);
      expect(reasons[0].querySelector('.reason-text')?.textContent).toBe(
        'HTTP message signature is invalid'
      );
      expect(reasons[0].querySelector('.reason-code')?.textContent).toBe(
        'invalid_signature'
      );
      expect(reasons[1].textContent?.trim()).toBe(
        'Auth token does not cover this scope'
      );
    });

    it('marks the Playground with the gear and other agents with a monogram', async () => {
      mock(api.activity).mockReturnValue(
        of({
          hasMore: false,
          rows: [
            activityRow({ id: 2 }),
            activityRow({
              id: 1,
              agentId: 'aauth:reports@agent.example',
              agentName: 'Acme Reports',
            }),
            activityRow({ id: 0, agentId: '', agentName: null }),
          ],
        })
      );
      await open('activity');
      const marks = Array.from(qa('aa-agent-mark'));
      expect(marks.length).toBe(2);
      expect(marks[0].querySelector('img')).toBeTruthy();
      expect(marks[1].textContent?.trim()).toBe('A');
    });

    it('invites a Try it run when empty, and offers Show all when a filter is empty', async () => {
      mock(api.activity).mockReturnValue(of({ hasMore: false, rows: [] }));
      await open('activity');
      expect(q('aa-activity-empty')?.textContent).toContain('No activity yet');
      expect(q('aa-activity-empty')?.textContent).toContain('Try it');

      (q('aa-activity-filter-rejected') as HTMLButtonElement).click();
      await settle();
      const empty = q('aa-activity-empty-filtered');
      expect(empty?.textContent).toContain('No rejected requests');
      (empty?.querySelector('button') as HTMLButtonElement).click();
      await settle();
      expect(q('aa-activity-filter-all')?.getAttribute('aria-pressed')).toBe(
        'true'
      );
    });
  });

  describe('Agents', () => {
    it('puts a tile before each name and says what the count counts', async () => {
      mock(api.agents).mockReturnValue(
        of([
          {
            id: 1,
            agentId: `aauth:playground@${host}`,
            issuer: ISSUER,
            name: 'DreamFactory Playground',
            status: 'allowed',
            firstSeenAt: null,
            lastSeenAt: null,
            requestCount: 1,
          },
          {
            id: 2,
            agentId: 'aauth:reports@agent.example',
            issuer: 'https://agent.example',
            name: 'Acme Reports',
            status: 'blocked',
            firstSeenAt: null,
            lastSeenAt: null,
            requestCount: 12,
          },
        ])
      );
      await open('agents');
      const rows = [q('aa-agent-1'), q('aa-agent-2')];
      expect(
        rows[0]?.querySelector('[data-testid="aa-agent-mark"] img')
      ).toBeTruthy();
      expect(
        rows[1]
          ?.querySelector('[data-testid="aa-agent-mark"]')
          ?.textContent?.trim()
      ).toBe('A');
      const counts = Array.from(qa('aa-agent-requests')).map(c =>
        c.textContent?.replace(/\s+/g, ' ').trim()
      );
      expect(counts).toEqual(['1 request', '12 requests']);
    });

    it('invites a Try it run when there are none', async () => {
      mock(api.agents).mockReturnValue(of([]));
      await open('agents');
      const empty = q('aa-agents-empty');
      expect(empty?.textContent).toContain('Try it');
      (empty?.querySelector('button') as HTMLButtonElement).click();
      await settle();
      expect(router.url).toContain('tab=try');
    });
  });

  describe('Grants', () => {
    it('shows the agent with its tile', async () => {
      await open('grants');
      const who = q('aa-grant-5')?.querySelector('.who');
      expect(who?.textContent).toContain('Acme Reports');
      expect(who?.querySelector('[data-testid="aa-agent-mark"]')).toBeTruthy();
    });

    it('invites a Try it run when there are none', async () => {
      mock(api.grants).mockReturnValue(of([]));
      await open('grants');
      expect(q('aa-grants-empty')?.textContent).toContain('Try it');
    });
  });

  describe('Person Servers', () => {
    it('shows each server’s scopes as one compact control', async () => {
      await open('servers');
      const controls = Array.from(qa('aa-server-scopes'));
      expect(controls.length).toBe(2);
      // No form-field chrome: the select itself is the control.
      expect(
        el().querySelector('[data-testid="aa-servers"] mat-form-field')
      ).toBeNull();
      const local = el().querySelector('[data-testid="aa-server-1"]');
      expect(
        local?.querySelector('[data-testid="aa-agent-mark"] img')
      ).toBeTruthy();
      expect(
        local?.querySelector('[data-testid="aa-server-scopes"] .chip')
          ?.textContent
      ).toBe('All scopes');
      const external = el().querySelector('[data-testid="aa-server-2"]');
      expect(
        external?.querySelector('[data-testid="aa-server-scopes"] .chip')
          ?.textContent
      ).toBe('sales.read');
    });
  });
});
