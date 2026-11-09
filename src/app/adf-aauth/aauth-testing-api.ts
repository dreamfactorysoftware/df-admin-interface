/** Fake DfAauthApiService for component specs (synchronous `of`). */
import { of } from 'rxjs';
import { overview, scope } from './aauth-testing';

export function fakeAauthApi() {
  return {
    overview: jest.fn(() => of(overview())),
    setEnabled: jest.fn((enabled: boolean) => of(overview({ enabled }))),
    scopes: jest.fn(() =>
      of([
        scope({ roleId: 1, roleName: 'Sales read', scope: 'sales.read' }),
        scope({
          roleId: 2,
          roleName: 'Sales refunds',
          scope: 'sales.refund',
          description: 'Update order status',
        }),
        scope({
          roleId: 3,
          roleName: 'Ops',
          scope: 'ops',
          description: null,
          enabled: false,
        }),
      ])
    ),
    updateScope: jest.fn((id: number, patch: object) =>
      of({ ...scope({ roleId: id }), ...patch })
    ),
    personServers: jest.fn(() =>
      of([
        {
          id: 2,
          issuer: 'https://ps.example',
          name: 'Acme PS',
          isLocal: false,
          enabled: true,
          scopes: ['sales.read'],
          lastUsedAt: null,
        },
        {
          id: 1,
          issuer: 'https://df.example.test',
          name: null,
          isLocal: true,
          enabled: true,
          scopes: [],
          lastUsedAt: null,
        },
      ])
    ),
    addPersonServer: jest.fn(),
    updatePersonServer: jest.fn(() => of({})),
    deletePersonServer: jest.fn(() => of(null)),
    agents: jest.fn(() =>
      of([
        {
          id: 1,
          agentId: 'aauth:reports@agent.example',
          issuer: 'https://agent.example',
          name: 'Acme Reports',
          status: 'allowed',
          firstSeenAt: '2026-11-09T10:00:00Z',
          lastSeenAt: new Date().toISOString(),
          requestCount: 12,
        },
      ])
    ),
    setAgentStatus: jest.fn(() => of({})),
    activity: jest.fn(() =>
      of([
        {
          id: 10,
          createdAt: new Date().toISOString(),
          agentId: 'aauth:reports@agent.example',
          agentName: 'Acme Reports',
          person: 'admin@example.com',
          psIssuer: 'https://df.example.test',
          scope: 'sales.read',
          method: 'GET',
          path: '/api/v2/sales/_table/orders',
          status: 200,
          outcome: 'allowed',
          detail: null,
        },
      ])
    ),
    grants: jest.fn(() =>
      of([
        {
          id: 5,
          userId: 1,
          userEmail: 'jordan@example.com',
          userName: 'Jordan Lee',
          resource: 'https://df.example.test',
          resourceName: 'DreamFactory',
          agentSub: 'aauth:reports@agent.example',
          agentName: 'Acme Reports',
          scope: 'sales.read sales.refund',
          createdAt: '2026-11-09T10:00:00Z',
          lastUsedAt: null,
        },
      ])
    ),
    revokeGrant: jest.fn(() => of(null)),
    playgroundSend: jest.fn(),
    playgroundAdvance: jest.fn(),
    playgroundReset: jest.fn(() => of({})),
  };
}
