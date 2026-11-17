import {
  isAutoProvisionedService,
  filterUserServices,
  ServiceOrigin,
} from './user-services';

// The service rows of a fresh install: the installer seeds these with no
// creator (rows copied from a 7.8 Gold instance). Keys are camelCase, as the
// app receives them after caseInterceptor (created_by_id -> createdById).
const SEEDED_SERVICES: ServiceOrigin[] = [
  { name: 'system', type: 'system', createdById: null },
  { name: 'api_docs', type: 'swagger', createdById: null },
  { name: 'files', type: 'local_file', createdById: null },
  { name: 'logs', type: 'local_file', createdById: null },
  { name: 'db', type: 'sqlite', createdById: null },
  { name: 'email', type: 'local_email', createdById: null },
  { name: 'user', type: 'user', createdById: null },
];

// Package migrations add these on every tier (df-api-builder ships with OSS,
// df-agents with Silver and Gold).
const MANAGEMENT_SERVICES: ServiceOrigin[] = [
  { name: 'api_builder', type: 'api_builder', createdById: null },
  { name: 'agents', type: 'agents', createdById: null },
];

describe('filterUserServices', () => {
  it('counts nothing on a fresh Gold or Silver install', () => {
    expect(
      filterUserServices([...MANAGEMENT_SERVICES, ...SEEDED_SERVICES])
    ).toEqual([]);
  });

  it('counts nothing on a fresh OSS install (api_builder, no agents)', () => {
    expect(
      filterUserServices([MANAGEMENT_SERVICES[0], ...SEEDED_SERVICES])
    ).toEqual([]);
  });

  it('counts a service created through a user session', () => {
    const clinic = { name: 'clinic', type: 'pgsql', createdById: 1 };
    expect(
      filterUserServices([...MANAGEMENT_SERVICES, ...SEEDED_SERVICES, clinic])
    ).toEqual([clinic]);
  });

  it('counts a session-created service even when its name looks like a system one', () => {
    const cache = { name: 'cache', type: 'redis', createdById: 1 };
    const mysql = { name: 'mysql', type: 'mysql', createdById: 1 };
    expect(filterUserServices([cache, mysql])).toEqual([cache, mysql]);
  });

  it('counts creator-less services a user made (API Builder API, API key, import)', () => {
    // API Builder publishes each custom API as an api_builder service and
    // never records a creator; API-key-only calls and config-package imports
    // leave createdById null too.
    const builtApi = {
      name: 'orders',
      type: 'api_builder',
      createdById: null,
    };
    const keyCreated = {
      name: 'warehouse',
      type: 'mysql',
      createdById: null,
    };
    expect(
      filterUserServices([
        ...MANAGEMENT_SERVICES,
        ...SEEDED_SERVICES,
        builtApi,
        keyCreated,
      ])
    ).toEqual([builtApi, keyCreated]);
  });

  it('reads a snake_case created_by_id on rows that skipped caseInterceptor', () => {
    const mysql = { name: 'mysql', type: 'mysql', created_by_id: 1 };
    const agents = { name: 'agents', type: 'agents', created_by_id: null };
    expect(filterUserServices([mysql, agents])).toEqual([mysql]);
  });

  it('still excludes seeded names when the server omits createdById', () => {
    const rows = [
      { name: 'system', type: 'system' },
      { name: 'files', type: 'local_file' },
      { name: 'clinic', type: 'pgsql' },
    ];
    expect(filterUserServices(rows)).toEqual([
      { name: 'clinic', type: 'pgsql' },
    ]);
  });

  it('tolerates a missing list and nameless rows', () => {
    expect(filterUserServices(undefined)).toEqual([]);
    expect(filterUserServices(null)).toEqual([]);
    expect(filterUserServices([{ name: '' }])).toEqual([]);
  });
});

describe('isAutoProvisionedService', () => {
  it('treats a creator-less service named after its own type as provisioned', () => {
    expect(
      isAutoProvisionedService({
        name: 'Agents',
        type: 'agents',
        createdById: null,
      })
    ).toBe(true);
  });

  it('never treats a service with a creator as provisioned', () => {
    expect(
      isAutoProvisionedService({
        name: 'db',
        type: 'sqlite',
        createdById: 1,
      })
    ).toBe(false);
  });
});
