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

  it('shows a failed run with its error', () => {
    store.run = run({ status: 'failed', error: 'Person Server unreachable' });
    fixture.detectChanges();
    expect(q('aa-run-error')?.textContent).toContain(
      'Person Server unreachable'
    );
  });
});
