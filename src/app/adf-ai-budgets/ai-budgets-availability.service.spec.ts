import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { DfSystemConfigDataService } from 'src/app/shared/services/df-system-config-data.service';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { Nav } from 'src/app/shared/types/nav';
import { ROUTES } from 'src/app/shared/types/routes';
import { Environment } from 'src/app/shared/types/system';
import { UserSession } from 'src/app/shared/types/user';
import {
  AI_BUDGETS_PROBE_URL,
  AiBudgetsAvailability,
  AiBudgetsAvailabilityService,
  availabilityFromError,
  serverMessage,
  withoutNavRoute,
} from './ai-budgets-availability.service';

const admin = (id = 1) =>
  ({ id, isSysAdmin: true, sessionToken: `token-${id}` }) as UserSession;
const roleUser = { id: 9, isSysAdmin: false } as UserSession;

function environment(packages?: string[]): Environment {
  return {
    authentication: {},
    server: {},
    ...(packages
      ? {
          platform: {
            packages: packages.map(name => ({ name, version: '1.0.0' })),
          },
        }
      : {}),
  } as unknown as Environment;
}

const WITH_DF_AI = ['dreamfactory/df-core', 'dreamfactory/df-ai'];

/** What a server without the route answers (read off a live 7.7 stack). */
const OLD_SERVER_BODY = 'Could not find a service for _internal';

describe('AiBudgetsAvailabilityService', () => {
  let userData$: BehaviorSubject<UserSession | null>;
  let environment$: BehaviorSubject<Environment>;
  let http: HttpTestingController;
  let service: AiBudgetsAvailabilityService;
  let states: AiBudgetsAvailability[];

  function setup(user: UserSession | null, env: Environment) {
    userData$ = new BehaviorSubject<UserSession | null>(user);
    environment$ = new BehaviorSubject<Environment>(env);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: DfUserDataService, useValue: { userData$ } },
        {
          provide: DfSystemConfigDataService,
          useValue: {
            environment$,
            get environment() {
              return environment$.value;
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AiBudgetsAvailabilityService);
    states = [];
    service.state$.subscribe(state => states.push(state));
  }

  afterEach(() => http.verify());

  it('asks nothing while signed out', () => {
    setup(null, environment(WITH_DF_AI));
    http.expectNone(AI_BUDGETS_PROBE_URL);
    expect(states).toEqual(['checking']);
  });

  it('asks nothing for a user who is not an admin', () => {
    setup(roleUser, environment(WITH_DF_AI));
    http.expectNone(AI_BUDGETS_PROBE_URL);
    expect(states).toEqual(['forbidden']);
  });

  it('asks nothing when the server lists its packages and df-ai is not one', () => {
    setup(admin(), environment(['dreamfactory/df-core']));
    http.expectNone(AI_BUDGETS_PROBE_URL);
    expect(states).toEqual(['checking', 'unsupported']);
  });

  it('is available when the alias route answers with a list', () => {
    setup(admin(), environment(WITH_DF_AI));
    const req = http.expectOne(AI_BUDGETS_PROBE_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ resource: [{ id: 1, name: 'gpt' }] });
    expect(states).toEqual(['checking', 'available']);
  });

  it('sends the session token itself: at login the cookie is not written yet', () => {
    // DfUserDataService publishes the user before it stores the token, so the
    // token interceptor has nothing to add when this request leaves. Without
    // the header the server answers 403 and a real admin loses the feature.
    setup(admin(7), environment(WITH_DF_AI));
    const req = http.expectOne(AI_BUDGETS_PROBE_URL);
    expect(req.request.headers.get('X-DreamFactory-Session-Token')).toBe(
      'token-7'
    );
    req.flush({ resource: [] });
  });

  it('sends one request however many screens ask', () => {
    setup(admin(), environment(WITH_DF_AI));
    const seen: boolean[] = [];
    service.available$.subscribe(v => seen.push(v));
    service.available$.subscribe();
    service.state$.subscribe();
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: [] });
    // Late subscribers get the stored answer.
    let late: AiBudgetsAvailability | undefined;
    service.state$.subscribe(s => (late = s));
    expect(late).toBe('available');
    expect(seen).toEqual([false, true]);
    http.expectNone(AI_BUDGETS_PROBE_URL);
  });

  it('reads an old server (404 HTML) as unsupported', () => {
    setup(admin(), environment(WITH_DF_AI));
    http
      .expectOne(AI_BUDGETS_PROBE_URL)
      .flush(OLD_SERVER_BODY, { status: 404, statusText: 'Not Found' });
    expect(states).toEqual(['checking', 'unsupported']);
    expect(service.forbiddenMessage).toBeNull();
  });

  it('reads a 403 as forbidden and keeps the server message', () => {
    setup(admin(), environment(WITH_DF_AI));
    http
      .expectOne(AI_BUDGETS_PROBE_URL)
      .flush(
        { error: { code: 403, message: 'Admin access required.' } },
        { status: 403, statusText: 'Forbidden' }
      );
    expect(states).toEqual(['checking', 'forbidden']);
    expect(service.forbiddenMessage).toBe('Admin access required.');
  });

  it('reads a 500 as unknown, not as unsupported', () => {
    setup(admin(), environment(WITH_DF_AI));
    http
      .expectOne(AI_BUDGETS_PROBE_URL)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    expect(states).toEqual(['checking', 'unknown']);
  });

  it('reads a 200 that is not an alias list as unknown', () => {
    setup(admin(), environment(WITH_DF_AI));
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ something: 'else' });
    expect(states).toEqual(['checking', 'unknown']);
  });

  it('checks again only on an explicit recheck', () => {
    setup(admin(), environment(WITH_DF_AI));
    http
      .expectOne(AI_BUDGETS_PROBE_URL)
      .flush('boom', { status: 502, statusText: 'Bad Gateway' });
    http.expectNone(AI_BUDGETS_PROBE_URL);
    service.recheck();
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: [] });
    expect(states).toEqual(['checking', 'unknown', 'checking', 'available']);
  });

  it('checks again for a different admin, and not for the same one', () => {
    setup(admin(1), environment(WITH_DF_AI));
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: [] });
    userData$.next({ ...admin(1), name: 'same person' } as UserSession);
    http.expectNone(AI_BUDGETS_PROBE_URL);
    userData$.next(null);
    userData$.next(admin(2));
    http
      .expectOne(AI_BUDGETS_PROBE_URL)
      .flush(null, { status: 403, statusText: 'Forbidden' });
    expect(states[states.length - 1]).toBe('forbidden');
  });

  it('waits for the environment payload, then probes', () => {
    setup(admin(), environment());
    http.expectNone(AI_BUDGETS_PROBE_URL);
    environment$.next(environment(WITH_DF_AI));
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: [] });
    expect(states).toEqual(['checking', 'available']);
  });

  it('probes anyway when the environment payload never loads', fakeAsync(() => {
    setup(admin(), environment());
    tick(3999);
    http.expectNone(AI_BUDGETS_PROBE_URL);
    tick(1);
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: [] });
    expect(states).toEqual(['checking', 'available']);
  }));

  it('hands the probed alias list out once', () => {
    setup(admin(), environment(WITH_DF_AI));
    const aliases = [{ id: 1, name: 'gpt' }];
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: aliases });
    expect(service.takeProbedAliases()).toEqual(aliases);
    expect(service.takeProbedAliases()).toBeNull();
  });

  it('does not hand out a probed alias list that has gone stale', () => {
    setup(admin(), environment(WITH_DF_AI));
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    http.expectOne(AI_BUDGETS_PROBE_URL).flush({ resource: [{ id: 1 }] });
    now.mockReturnValue(1_000_000 + 60_001);
    expect(service.takeProbedAliases()).toBeNull();
    now.mockRestore();
  });
});

describe('availabilityFromError', () => {
  it('maps status codes', () => {
    expect(availabilityFromError({ status: 404 })).toBe('unsupported');
    expect(availabilityFromError({ status: 403 })).toBe('forbidden');
    expect(availabilityFromError({ status: 500 })).toBe('unknown');
    expect(availabilityFromError({ status: 0 })).toBe('unknown');
    expect(availabilityFromError(null)).toBe('unknown');
  });
});

describe('serverMessage', () => {
  it('reads a DreamFactory error body and nothing else', () => {
    expect(
      serverMessage({ error: { error: { message: 'Admin access required.' } } })
    ).toBe('Admin access required.');
    expect(serverMessage({ error: OLD_SERVER_BODY })).toBeNull();
    expect(serverMessage({ error: null })).toBeNull();
    expect(serverMessage(undefined)).toBeNull();
  });
});

describe('withoutNavRoute', () => {
  const nav = (): Nav[] => [
    { path: '/home', route: ROUTES.HOME },
    {
      path: '/ai',
      route: ROUTES.AI,
      subRoutes: [
        { path: '/ai/usage', route: ROUTES.AI_USAGE },
        { path: '/ai/budgets', route: ROUTES.AI_BUDGETS },
        { path: '/ai/mcp', route: ROUTES.AI_MCP },
      ],
    },
  ];

  it('drops the route and keeps its siblings in order', () => {
    const out = withoutNavRoute(nav(), ROUTES.AI_BUDGETS);
    expect(out.map(n => n.route)).toEqual([ROUTES.HOME, ROUTES.AI]);
    expect(out[1].subRoutes?.map(n => n.route)).toEqual([
      ROUTES.AI_USAGE,
      ROUTES.AI_MCP,
    ]);
  });

  it('does not change the nav it was given', () => {
    const input = nav();
    withoutNavRoute(input, ROUTES.AI_BUDGETS);
    expect(input[1].subRoutes).toHaveLength(3);
  });

  it('leaves a nav without the route as it was', () => {
    const input = nav();
    expect(withoutNavRoute(input, ROUTES.SCHEDULER)).toEqual(input);
  });
});
