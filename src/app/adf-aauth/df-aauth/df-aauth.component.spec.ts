import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  tick,
} from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfAauthComponent } from './df-aauth.component';
import { DfAauthApiService } from '../aauth-api.service';
import { aauthTransloco, overview } from '../aauth-testing';
import { fakeAauthApi } from '../aauth-testing-api';

describe('DfAauthComponent', () => {
  let fixture: ComponentFixture<DfAauthComponent>;
  let api: ReturnType<typeof fakeAauthApi>;
  let router: Router;
  let dialog: { open: jest.Mock };

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (id: string) => el().querySelector(`[data-testid="${id}"]`);
  const qa = (id: string) => el().querySelectorAll(`[data-testid="${id}"]`);

  async function create() {
    fixture = TestBed.createComponent(DfAauthComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function openTab(tab: string | null) {
    await router.navigate([], { queryParams: { tab } });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    api = fakeAauthApi();
    dialog = { open: jest.fn(() => ({ afterClosed: () => of(true) })) };
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
    }).overrideProvider(MatDialog, { useValue: dialog });
    router = TestBed.inject(Router);
  });

  it('shows the Enabled switch, the issuer and tab counts; no page title', async () => {
    await create();
    expect(q('aa-enabled')).toBeTruthy();
    expect(q('aa-issuer')?.textContent).toContain('https://df.example.test');
    expect(q('aa-issuer-error')).toBeNull();
    expect(q('aa-count-scopes')?.textContent?.trim()).toBe('2');
    expect(q('aa-count-agents')?.textContent?.trim()).toBe('3');
    expect(q('aa-count-try')).toBeNull();
    expect(el().querySelector('h1')).toBeNull();
    expect(qa('aa-tab-select').length).toBe(1);
  });

  it('disables the switch and says what to set when the issuer is unusable', async () => {
    api.overview.mockReturnValue(
      of(overview({ enabled: false, issuer: null, issuerOk: false }))
    );
    await create();
    expect(q('aa-issuer-error')?.textContent).toContain(
      'Set DF_AAUTH_ISSUER to an https URL'
    );
    const input = el().querySelector(
      '[data-testid="aa-enabled"] button'
    ) as HTMLButtonElement;
    expect(input.disabled).toBe(true);
  });

  it('shows a retry state when the backend is missing', async () => {
    api.overview.mockReturnValue(throwError(() => ({ status: 404 })));
    await create();
    expect(q('aa-load-failed')).toBeTruthy();
  });

  it('renders the Scopes tab by default, enabled scopes first', async () => {
    await create();
    const names = Array.from(qa('aa-scope-name')).map(e =>
      e.querySelector('.value')?.textContent?.trim()
    );
    expect(names).toEqual(['sales.read', 'sales.refund', 'ops']);
  });

  it('opens each tab from ?tab=', async () => {
    await create();
    await openTab('servers');
    expect(q('aa-servers')).toBeTruthy();
    // The local Person Server is always first and cannot be removed.
    const firstRow = el().querySelector(
      '[data-testid="aa-servers"] .row:not(.head)'
    );
    expect(firstRow?.textContent).toContain('This DreamFactory');
    expect(
      firstRow?.querySelector('[data-testid="aa-server-remove"]')
    ).toBeNull();
    expect(qa('aa-server-remove').length).toBe(1);

    await openTab('agents');
    expect(q('aa-agent-1')?.textContent).toContain('Acme Reports');
    expect(q('aa-agent-1')?.textContent).toContain('agent.example');

    await openTab('activity');
    expect(q('aa-activity-row')?.textContent).toContain('GET');
    expect(q('aa-activity-outcome')?.textContent).toContain('Allowed');

    await openTab('grants');
    expect(q('aa-grant-5')?.textContent).toContain('Jordan Lee');
    expect(q('aa-grant-5')?.querySelectorAll('.chip').length).toBe(2);

    await openTab('try');
    expect(q('aa-try-send')).toBeTruthy();
  });

  it('revokes a grant after the confirm', async () => {
    await create();
    await openTab('grants');
    (q('aa-grant-revoke') as HTMLButtonElement).click();
    expect(dialog.open).toHaveBeenCalled();
    expect(api.revokeGrant).toHaveBeenCalledWith(5);
  });

  it('edits a scope name in place: Enter saves, Escape cancels', fakeAsync(() => {
    fixture = TestBed.createComponent(DfAauthComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    (q('aa-scope-name') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = q('aa-scope-input') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    input.value = 'sales.orders';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    tick();
    expect(api.updateScope).toHaveBeenCalledWith(1, { scope: 'sales.orders' });
    expect(q('aa-scope-input')).toBeNull();

    (qa('aa-scope-desc')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const desc = q('aa-scope-desc-input') as HTMLInputElement;
    desc.value = 'changed';
    desc.dispatchEvent(new Event('input'));
    desc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(api.updateScope).toHaveBeenCalledTimes(1);
    flush();
  }));

  it('toggles a scope', async () => {
    await create();
    const toggle = el().querySelector(
      '[data-testid="aa-scope-3"] [data-testid="aa-scope-toggle"] button'
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(api.updateScope).toHaveBeenCalledWith(3, { enabled: true });
  });
});

/** The shared paywall tracks a hit and boots Calendly: stubbed here. */
@Component({ selector: 'df-paywall', standalone: true, template: '' })
class StubPaywallComponent {
  @Input() serviceName = '';
}

describe('DfAauthComponent (paywall)', () => {
  let api: ReturnType<typeof fakeAauthApi>;

  function create(data: 'paywall' | 'ok') {
    api = fakeAauthApi();
    TestBed.configureTestingModule({
      imports: [DfAauthComponent, aauthTransloco(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ data }),
            queryParamMap: of(convertToParamMap({})),
          },
        },
        { provide: DfAauthApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    TestBed.overrideComponent(DfAauthComponent, {
      remove: { imports: [DfPaywallComponent] },
      add: { imports: [StubPaywallComponent] },
    });
    const fixture = TestBed.createComponent(DfAauthComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('without the aauth resource shows the shared paywall, on any license', () => {
    const fixture = create('paywall');
    const paywall = fixture.debugElement.query(
      By.directive(StubPaywallComponent)
    );
    expect(paywall).toBeTruthy();
    expect(paywall.componentInstance.serviceName).toBe('AAuth');
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.aa')).toBeNull();
    expect(el.querySelector('[data-testid="aa-enabled"]')).toBeNull();
    // Nothing is asked of a backend that is not there.
    expect(api.overview).not.toHaveBeenCalled();
    expect(api.scopes).not.toHaveBeenCalled();
  });

  it('with the resource opens the page, no paywall', () => {
    const fixture = create('ok');
    expect(
      fixture.debugElement.query(By.directive(StubPaywallComponent))
    ).toBeNull();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.aa')).toBeTruthy();
    expect(api.overview).toHaveBeenCalled();
  });
});
