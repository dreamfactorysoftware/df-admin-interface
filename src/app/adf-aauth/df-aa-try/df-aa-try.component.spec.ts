import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfAaTryComponent } from './df-aa-try.component';
import { DfAauthApiService } from '../aauth-api.service';
import { AauthStore, POLL_MS } from '../aauth.store';
import { aauthTransloco, jwt, overview, run } from '../aauth-testing';
import { fakeAauthApi } from '../aauth-testing-api';
import { PlaygroundRun } from '../aauth.types';

const AGENT_TOKEN = jwt(
  { alg: 'EdDSA', typ: 'aa-agent+jwt', kid: 'pg' },
  {
    iss: 'https://df.example.test',
    sub: 'aauth:playground@df.example.test',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
);

function waitingRun(): PlaygroundRun {
  return run({
    status: 'waiting',
    pending: {
      code: 'K7QX-4MPA',
      url: 'https://df.example.test/aauth/interact?code=K7QX-4MPA',
    },
    steps: [
      {
        kind: 'agent_token',
        title: 'Agent token from DreamFactory Playground',
        request: null,
        response: null,
        tokens: [AGENT_TOKEN],
      },
      {
        kind: 'call',
        title: 'Signed call',
        request: {
          method: 'GET',
          url: 'https://df.example.test/api/v2/sales/_table/orders?limit=5',
          headers: [
            ['Signature-Key', 'sig=jwt;jwt="eyJ..."'],
            ['Signature-Input', 'sig=("@method" "@authority" "@path")'],
            ['Accept', 'application/json'],
          ],
          body: null,
        },
        response: {
          status: 401,
          headers: [['AAuth-Requirement', 'requirement=person-token']],
          body: '{"error":"person_token_required"}',
        },
        tokens: [],
      },
    ],
  });
}

describe('DfAaTryComponent', () => {
  let fixture: ComponentFixture<DfAaTryComponent>;
  let api: ReturnType<typeof fakeAauthApi>;
  let store: AauthStore;

  const el = () => fixture.nativeElement as HTMLElement;
  const q = (id: string) => el().querySelector(`[data-testid="${id}"]`);
  const qa = (id: string) => el().querySelectorAll(`[data-testid="${id}"]`);

  beforeEach(() => {
    api = fakeAauthApi();
    TestBed.configureTestingModule({
      imports: [DfAaTryComponent, aauthTransloco(), NoopAnimationsModule],
      providers: [
        AauthStore,
        { provide: DfAauthApiService, useValue: api },
        {
          provide: DfSnackbarService,
          useValue: { openSnackBar: jest.fn(), openError: jest.fn() },
        },
      ],
    });
    store = TestBed.inject(AauthStore);
    store.overview = overview();
    fixture = TestBed.createComponent(DfAaTryComponent);
    fixture.detectChanges();
  });

  it('prefixes the path with the issuer origin and defaults to orders', () => {
    expect(q('aa-try-url')?.textContent).toContain('https://df.example.test');
    expect(store.path).toBe('/api/v2/sales/_table/orders?limit=5');
    expect(q('aa-try-body')).toBeNull();
  });

  it('shows a body field for POST, PATCH and PUT', () => {
    store.method = 'PATCH';
    fixture.detectChanges();
    expect(q('aa-try-body')).toBeTruthy();
  });

  it('cannot send while AAuth is off', () => {
    store.overview = overview({ enabled: false });
    fixture.detectChanges();
    expect((q('aa-try-send') as HTMLButtonElement).disabled).toBe(true);
  });

  it('waits for approval: big code, Approve opens the consent page, polls every 2 s', fakeAsync(() => {
    api.playgroundSend.mockReturnValue(of(waitingRun()));
    api.playgroundAdvance.mockReturnValue(of(waitingRun()));
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    (q('aa-try-send') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(q('aa-approve-code')?.textContent?.trim()).toBe('K7QX-4MPA');
    (q('aa-approve') as HTMLButtonElement).click();
    expect(open).toHaveBeenCalledWith(
      'https://df.example.test/aauth/interact?code=K7QX-4MPA',
      '_blank',
      'noopener'
    );
    expect((q('aa-try-send') as HTMLButtonElement).disabled).toBe(true);

    tick(POLL_MS);
    expect(api.playgroundAdvance).toHaveBeenCalledTimes(1);

    // Leaving the tab stops the polling.
    fixture.destroy();
    tick(POLL_MS * 3);
    expect(api.playgroundAdvance).toHaveBeenCalledTimes(1);
    open.mockRestore();
    discardPeriodicTasks();
  }));

  it('renders the timeline and expands a step to headers, body and decoded tokens', () => {
    store.run = waitingRun();
    fixture.detectChanges();
    const steps = qa('aa-step');
    expect(steps.length).toBe(2);
    expect(qa('aa-step-kind')[0].textContent).toContain('Agent token');
    expect(steps[1].textContent).toContain(
      'GET /api/v2/sales/_table/orders?limit=5'
    );
    expect(qa('aa-step-status')[0].textContent).toContain('401');

    (steps[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    const token = q('aa-token');
    expect(token?.textContent).toContain('aa-agent+jwt');
    expect(token?.textContent).toContain('aauth:playground@df.example.test');

    (steps[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const details = qa('aa-step-detail');
    const call = details[details.length - 1];
    const proto = Array.from(call.querySelectorAll('.h.proto .hn')).map(
      e => e.textContent
    );
    expect(proto).toEqual([
      'Signature-Key',
      'Signature-Input',
      'AAuth-Requirement',
    ]);
    expect(call.textContent).toContain('"error"');
  });

  it('shows the final response as the last row, expanded', () => {
    store.run = run({
      status: 'done',
      result: { status: 200, body: '{"resource":[{"id":1}]}' },
    });
    fixture.detectChanges();
    expect(q('aa-run-result-status')?.textContent).toContain('200');
    expect(q('aa-run-result')?.textContent).toContain('"resource"');
  });

  it('draws each step on its lane, coloured by the answer', () => {
    store.run = waitingRun();
    fixture.detectChanges();
    expect(
      Array.from(qa('aa-lanes')[0].querySelectorAll('.lane-name')).map(e =>
        e.textContent?.trim()
      )
    ).toEqual(['Agent', 'API', 'Person Server']);
    const strips = Array.from(qa('aa-lane')) as HTMLElement[];
    expect(strips.map(s => s.dataset['lane'])).toEqual(['agent', 'api']);
    expect(strips.map(s => s.dataset['tone'])).toEqual(['neutral', 'warning']);
    // The Playground agent shows DreamFactory's gear on step 1 only.
    expect(qa('aa-agent-mark').length).toBe(1);
    expect(q('aa-lanes-idle')).toBeNull();
  });

  it('hangs the Approve card off the Person Server lane', () => {
    store.run = waitingRun();
    fixture.detectChanges();
    const row = q('aa-approve-card')?.closest('li');
    expect(row?.querySelector('.strip')?.getAttribute('data-lane')).toBe('ps');
    expect(row?.parentElement?.getAttribute('data-testid')).toBe('aa-timeline');
  });

  it('shows the idle lifelines before the first Send', () => {
    expect(q('aa-lanes-idle')).toBeTruthy();
    expect(q('aa-timeline')).toBeNull();
  });

  it('draws in only the newest step', () => {
    store.run = waitingRun();
    fixture.detectChanges();
    const entering = () =>
      Array.from(qa('aa-lane')).map(s => s.classList.contains('enter'));
    expect(entering()).toEqual([false, true]);

    // The next poll adds a step: it, and only it, draws in.
    const next = waitingRun();
    next.steps.push({
      kind: 'discover',
      title: 'Person server metadata',
      request: {
        method: 'GET',
        url: 'https://df.example.test/.well-known/aauth-person.json',
        headers: [],
        body: null,
      },
      response: { status: 200, headers: [], body: '{}' },
      tokens: [],
    });
    store.run = next;
    fixture.detectChanges();
    expect(entering()).toEqual([false, false, true]);
    expect((qa('aa-lane')[2] as HTMLElement).dataset['lane']).toBe('ps');
  });

  it('replays nothing when the tab opens on a run already drawn', () => {
    store.run = waitingRun();
    const again = TestBed.createComponent(DfAaTryComponent);
    again.detectChanges();
    const strips = (again.nativeElement as HTMLElement).querySelectorAll(
      '[data-testid="aa-lane"].enter'
    );
    expect(strips.length).toBe(0);
    again.destroy();
  });

  it("leaves the final call's body to the Response card", () => {
    const done = waitingRun();
    done.status = 'done';
    done.pending = null;
    done.steps.push({
      kind: 'call',
      title: 'Signed call',
      request: {
        method: 'GET',
        url: 'https://df.example.test/api/v2/sales/_table/orders?limit=5',
        headers: [],
        body: null,
      },
      response: {
        status: 200,
        headers: [['AAuth-Scope', 'sales.read']],
        body: '{"resource":[{"id":1}]}',
      },
      tokens: [],
    });
    done.result = { status: 200, body: '{"resource":[{"id":1}]}' };
    store.run = done;
    fixture.detectChanges();

    const steps = qa('aa-step');
    (steps[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    let detail = qa('aa-step-detail')[0];
    expect(detail.textContent).toContain('AAuth-Scope');
    expect(detail.querySelector('[data-testid="aa-step-response-body"]')).toBe(
      null
    );
    expect(detail.textContent).not.toContain('Empty body');
    expect(q('aa-run-result')?.textContent).toContain('"resource"');

    // Earlier calls still show theirs.
    (steps[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    detail = qa('aa-step-detail')[0];
    expect(
      detail.querySelector('[data-testid="aa-step-response-body"]')
    ).toBeTruthy();
  });

  it('clamps long header values and decodes the JWT inside Signature-Key', () => {
    const presented = jwt(
      { alg: 'EdDSA', typ: 'aa-auth+jwt', kid: 'ps' },
      {
        iss: 'https://df.example.test',
        sub: 'jordan',
        scope: 'sales.read',
        pad: 'x'.repeat(200),
      }
    );
    const r = waitingRun();
    r.steps[1] = {
      ...r.steps[1],
      request: {
        method: 'GET',
        url: 'https://df.example.test/api/v2/sales/_table/orders?limit=5',
        headers: [
          ['Signature-Key', `sig=jwt;jwt="${presented}"`],
          ['Accept', 'application/json'],
        ],
        body: null,
      },
    };
    store.run = r;
    fixture.detectChanges();
    (qa('aa-step')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const values = qa('aa-header-value');
    expect(values[0].classList.contains('clamped')).toBe(true);
    expect(values[1].classList.contains('clamped')).toBe(false);
    expect(qa('aa-header-more').length).toBe(1);

    (q('aa-header-more') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(qa('aa-header-value')[0].classList.contains('clamped')).toBe(false);

    const chip = q('aa-header-jwt') as HTMLButtonElement;
    expect(chip.textContent).toContain('aa-auth+jwt');
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    chip.click();
    fixture.detectChanges();
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    const decoded = q('aa-header-token');
    expect(decoded?.textContent).toContain('"scope"');
    expect(decoded?.textContent).toContain('sales.read');
  });

  it('shows a failed run with its error', () => {
    store.run = run({ status: 'failed', error: 'Person Server unreachable' });
    fixture.detectChanges();
    expect(q('aa-run-error')?.textContent).toContain(
      'Person Server unreachable'
    );
  });
});
