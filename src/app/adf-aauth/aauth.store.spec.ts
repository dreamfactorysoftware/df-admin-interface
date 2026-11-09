import {
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { DfSnackbarService } from 'src/app/shared/services/df-snackbar.service';
import { DfAauthApiService } from './aauth-api.service';
import { ACTIVITY_PAGE, AauthStore, POLL_MS } from './aauth.store';
import { aauthTransloco, overview, run, scope } from './aauth-testing';
import { PlaygroundRun } from './aauth.types';

function fakeApi() {
  return {
    overview: jest.fn(() => of(overview())),
    setEnabled: jest.fn(),
    scopes: jest.fn(() =>
      of([
        scope({ roleId: 1, roleName: 'Zeta', scope: 'z', enabled: false }),
        scope({ roleId: 2, roleName: 'Alpha', scope: 'a', enabled: false }),
        scope({ roleId: 3, roleName: 'Mid', scope: 'm', enabled: true }),
      ])
    ),
    updateScope: jest.fn(),
    personServers: jest.fn(),
    addPersonServer: jest.fn(),
    updatePersonServer: jest.fn(),
    deletePersonServer: jest.fn(),
    agents: jest.fn(),
    setAgentStatus: jest.fn(),
    activity: jest.fn(),
    grants: jest.fn(),
    revokeGrant: jest.fn(),
    playgroundSend: jest.fn(),
    playgroundAdvance: jest.fn(),
    playgroundReset: jest.fn(() => of({})),
  };
}

describe('AauthStore', () => {
  let store: AauthStore;
  let api: ReturnType<typeof fakeApi>;
  let snackbar: { openSnackBar: jest.Mock; openError: jest.Mock };

  beforeEach(() => {
    api = fakeApi();
    snackbar = { openSnackBar: jest.fn(), openError: jest.fn() };
    TestBed.configureTestingModule({
      imports: [aauthTransloco()],
      providers: [
        AauthStore,
        { provide: DfAauthApiService, useValue: api },
        { provide: DfSnackbarService, useValue: snackbar },
      ],
    });
    store = TestBed.inject(AauthStore);
  });

  afterEach(() => store.ngOnDestroy());

  describe('load', () => {
    it('loads the overview and scopes, enabled first then by name', () => {
      store.load();
      expect(store.loading).toBe(false);
      expect(store.loadFailed).toBe(false);
      expect(store.overview?.issuer).toBe('https://df.example.test');
      expect(store.scopeOrder).toEqual([3, 2, 1]);
    });

    it('marks the page failed, with the server reason only for 503', () => {
      api.overview.mockReturnValue(
        throwError(() => ({
          __appError: true,
          status: 503,
          message: 'Run setup',
        }))
      );
      store.load();
      expect(store.loadFailed).toBe(true);
      expect(store.loadError).toBe('Run setup');
    });
  });

  describe('enabled', () => {
    beforeEach(() => store.load());

    it('switches on and takes the server state', () => {
      api.setEnabled.mockReturnValue(of(overview({ enabled: true })));
      store.overview!.enabled = false;
      store.setEnabled(true);
      expect(api.setEnabled).toHaveBeenCalledWith(true);
      expect(store.overview?.enabled).toBe(true);
      expect(snackbar.openSnackBar).toHaveBeenCalledWith(
        'AAuth is on',
        'success'
      );
    });

    it('rolls back on failure', () => {
      api.setEnabled.mockReturnValue(throwError(() => ({ status: 400 })));
      store.setEnabled(false);
      expect(store.overview?.enabled).toBe(true);
      expect(snackbar.openError).toHaveBeenCalled();
    });

    it('never enables without a valid issuer', () => {
      store.overview = overview({ enabled: false, issuerOk: false });
      store.setEnabled(true);
      expect(api.setEnabled).not.toHaveBeenCalled();
    });
  });

  describe('scopes', () => {
    beforeEach(() => store.load());

    it('rejects invalid and duplicate scope names without a request', () => {
      expect(store.updateScope(1, { scope: 'Bad Name' })).toBe(false);
      expect(store.updateScope(1, { scope: 'a' })).toBe(false);
      expect(api.updateScope).not.toHaveBeenCalled();
      expect(snackbar.openSnackBar).toHaveBeenCalledTimes(2);
    });

    it('applies optimistically and keeps the row order', () => {
      api.updateScope.mockReturnValue(
        of(scope({ roleId: 1, enabled: true, scope: 'z' }))
      );
      expect(store.updateScope(1, { enabled: true })).toBe(true);
      expect(store.scopes!.find(s => s.roleId === 1)!.enabled).toBe(true);
      expect(store.scopeOrder).toEqual([3, 2, 1]);
      // Counts follow: a quiet overview re-read.
      expect(api.overview).toHaveBeenLastCalledWith(true);
    });

    it('rolls back a failed write', () => {
      api.updateScope.mockReturnValue(throwError(() => ({ status: 400 })));
      store.updateScope(2, { scope: 'alpha.read' });
      expect(store.scopes!.find(s => s.roleId === 2)!.scope).toBe('a');
      expect(snackbar.openError).toHaveBeenCalled();
    });

    it('ignores a slow failure that a newer write superseded', () => {
      const first = new Subject<never>();
      api.updateScope
        .mockReturnValueOnce(first)
        .mockReturnValueOnce(
          of(scope({ roleId: 2, scope: 'a', description: 'new' }))
        );
      store.updateScope(2, { description: 'old' });
      store.updateScope(2, { description: 'new' });
      first.error({ status: 500 });
      expect(store.scopes!.find(s => s.roleId === 2)!.description).toBe('new');
      expect(snackbar.openError).not.toHaveBeenCalled();
    });
  });

  describe('lists', () => {
    it('adds a Person Server and clears the input', () => {
      store.servers = [];
      api.addPersonServer.mockReturnValue(
        of({
          id: 9,
          issuer: 'https://ps.example',
          name: 'PS',
          isLocal: false,
          enabled: true,
          scopes: [],
          lastUsedAt: null,
        })
      );
      const done = jest.fn();
      store.addServer('https://ps.example/', done);
      expect(api.addPersonServer).toHaveBeenCalledWith('https://ps.example');
      expect(store.servers.length).toBe(1);
      expect(done).toHaveBeenCalled();
    });

    it('never deletes the local Person Server and restores a failed delete', () => {
      store.servers = [
        {
          id: 1,
          issuer: 'https://df',
          name: null,
          isLocal: true,
          enabled: true,
          scopes: [],
          lastUsedAt: null,
        },
        {
          id: 2,
          issuer: 'https://ps',
          name: null,
          isLocal: false,
          enabled: true,
          scopes: [],
          lastUsedAt: null,
        },
      ];
      store.deleteServer(1);
      expect(api.deletePersonServer).not.toHaveBeenCalled();
      api.deletePersonServer.mockReturnValue(
        throwError(() => ({ status: 500 }))
      );
      store.deleteServer(2);
      expect(store.servers.map(s => s.id)).toEqual([1, 2]);
    });

    it('marks a slice failed and clears it on success', () => {
      api.agents.mockReturnValueOnce(throwError(() => ({ status: 500 })));
      store.loadAgents();
      expect(store.failed.has('agents')).toBe(true);
      api.agents.mockReturnValueOnce(of([]));
      store.loadAgents();
      expect(store.failed.has('agents')).toBe(false);
      expect(store.agents).toEqual([]);
    });

    it('blocks an agent optimistically', () => {
      store.agents = [
        {
          id: 4,
          agentId: 'a',
          issuer: 'https://ap',
          name: null,
          status: 'allowed',
          firstSeenAt: null,
          lastSeenAt: null,
          requestCount: 1,
        },
      ];
      api.setAgentStatus.mockReturnValue(throwError(() => ({ status: 500 })));
      store.setAgentBlocked(4, true);
      expect(api.setAgentStatus).toHaveBeenCalledWith(4, 'blocked');
      expect(store.agents[0].status).toBe('allowed');
    });

    it('pages older activity by the last id', () => {
      const page = Array.from({ length: ACTIVITY_PAGE }, (_, i) => ({
        id: 500 - i,
      }));
      api.activity
        .mockReturnValueOnce(of(page))
        .mockReturnValueOnce(of([{ id: 1 }]));
      store.loadActivity();
      expect(store.activityHasMore).toBe(true);
      store.loadOlderActivity();
      expect(api.activity).toHaveBeenLastCalledWith(ACTIVITY_PAGE, 401);
      expect(store.activity!.length).toBe(ACTIVITY_PAGE + 1);
      expect(store.activityHasMore).toBe(false);
    });

    it('revokes a grant and restores it on failure', () => {
      store.grants = [{ id: 3 } as never];
      api.revokeGrant.mockReturnValue(throwError(() => ({ status: 500 })));
      store.revokeGrant(3);
      expect(store.grants!.length).toBe(1);
    });
  });

  describe('playground', () => {
    const waiting = (): PlaygroundRun =>
      run({
        status: 'waiting',
        pending: {
          code: 'ABCD-EFGH',
          url: 'https://df/aauth/interact?code=ABCD-EFGH',
        },
      });

    it('sends, then polls advance every 2 s until the run settles', fakeAsync(() => {
      api.playgroundSend.mockReturnValue(of(waiting()));
      api.playgroundAdvance
        .mockReturnValueOnce(of(waiting()))
        .mockReturnValueOnce(
          of(run({ status: 'done', result: { status: 200, body: '{}' } }))
        );
      store.method = 'GET';
      store.path = 'api/v2/sales/_table/orders';
      store.send();
      expect(api.playgroundSend).toHaveBeenCalledWith({
        method: 'GET',
        path: '/api/v2/sales/_table/orders',
      });
      expect(store.run?.status).toBe('waiting');
      tick(POLL_MS - 1);
      expect(api.playgroundAdvance).not.toHaveBeenCalled();
      tick(1);
      expect(api.playgroundAdvance).toHaveBeenCalledWith('r1');
      tick(POLL_MS);
      expect(store.run?.status).toBe('done');
      tick(POLL_MS * 3);
      expect(api.playgroundAdvance).toHaveBeenCalledTimes(2);
    }));

    it('stops polling when asked (tab left or page destroyed)', fakeAsync(() => {
      api.playgroundSend.mockReturnValue(of(waiting()));
      api.playgroundAdvance.mockReturnValue(of(waiting()));
      store.send();
      store.stopPolling();
      tick(POLL_MS * 3);
      expect(api.playgroundAdvance).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('gives up after repeated poll failures', fakeAsync(() => {
      api.playgroundSend.mockReturnValue(of(waiting()));
      api.playgroundAdvance.mockReturnValue(
        throwError(() => ({ status: 0, message: 'offline' }))
      );
      store.send();
      tick(POLL_MS * 5);
      expect(store.run?.status).toBe('failed');
      tick(POLL_MS * 3);
      expect(api.playgroundAdvance).toHaveBeenCalledTimes(5);
    }));

    it('sends a body only for POST, PATCH and PUT, and only valid JSON', () => {
      api.playgroundSend.mockReturnValue(of(run()));
      store.method = 'PATCH';
      store.body = '{bad';
      store.send();
      expect(api.playgroundSend).not.toHaveBeenCalled();
      store.body = '{"status":"refunded"}';
      store.send();
      expect(api.playgroundSend).toHaveBeenLastCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          body: '{"status":"refunded"}',
        })
      );
      store.method = 'GET';
      store.send();
      expect(api.playgroundSend.mock.calls[1][0].body).toBeUndefined();
    });

    it('reset forgets the run', () => {
      store.run = run();
      store.reset();
      expect(api.playgroundReset).toHaveBeenCalled();
      expect(store.run).toBeNull();
    });
  });
});
