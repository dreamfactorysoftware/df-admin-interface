import {
  isAutoProvisionedService,
  ServiceOrigin,
  userServices,
} from './user-services';

// The service rows of a fresh install: the installer seeds these with no
// creator (rows copied from a 7.8 Gold instance).
const SEEDED_SERVICES: ServiceOrigin[] = [
  { name: 'system', type: 'system', created_by_id: null },
  { name: 'api_docs', type: 'swagger', created_by_id: null },
  { name: 'files', type: 'local_file', created_by_id: null },
  { name: 'logs', type: 'local_file', created_by_id: null },
  { name: 'db', type: 'sqlite', created_by_id: null },
  { name: 'email', type: 'local_email', created_by_id: null },
  { name: 'user', type: 'user', created_by_id: null },
];

// Package migrations add these on every tier (df-api-builder ships with OSS,
// df-agents with Silver and Gold).
const MANAGEMENT_SERVICES: ServiceOrigin[] = [
  { name: 'api_builder', type: 'api_builder', created_by_id: null },
  { name: 'agents', type: 'agents', created_by_id: null },
];

describe('userServices', () => {
  it('counts nothing on a fresh Gold or Silver install', () => {
    expect(userServices([...MANAGEMENT_SERVICES, ...SEEDED_SERVICES])).toEqual(
      []
    );
  });

  it('counts nothing on a fresh OSS install (api_builder, no agents)', () => {
    expect(userServices([MANAGEMENT_SERVICES[0], ...SEEDED_SERVICES])).toEqual(
      []
    );
  });

  it('counts a service created through a user session', () => {
    const clinic = { name: 'clinic', type: 'pgsql', created_by_id: 1 };
    expect(
      userServices([...MANAGEMENT_SERVICES, ...SEEDED_SERVICES, clinic])
    ).toEqual([clinic]);
  });

  it('counts a session-created service even when its name looks like a system one', () => {
    const cache = { name: 'cache', type: 'redis', created_by_id: 1 };
    const mysql = { name: 'mysql', type: 'mysql', created_by_id: 1 };
    expect(userServices([cache, mysql])).toEqual([cache, mysql]);
  });

  it('counts creator-less services a user made (API Builder API, API key, import)', () => {
    // API Builder publishes each custom API as an api_builder service and
    // never records a creator; API-key-only calls and package/config imports
    // leave created_by_id null too.
    const builtApi = {
      name: 'orders',
      type: 'api_builder',
      created_by_id: null,
    };
    const keyCreated = {
      name: 'warehouse',
      type: 'mysql',
      created_by_id: null,
    };
    expect(
      userServices([
        ...MANAGEMENT_SERVICES,
        ...SEEDED_SERVICES,
        builtApi,
        keyCreated,
      ])
    ).toEqual([builtApi, keyCreated]);
  });

  it('still excludes seeded names when the server omits created_by_id', () => {
    const rows = [
      { name: 'system', type: 'system' },
      { name: 'files', type: 'local_file' },
      { name: 'clinic', type: 'pgsql' },
    ];
    expect(userServices(rows)).toEqual([{ name: 'clinic', type: 'pgsql' }]);
  });

  it('tolerates a missing list and nameless rows', () => {
    expect(userServices(undefined)).toEqual([]);
    expect(userServices(null)).toEqual([]);
    expect(userServices([{ name: '' }])).toEqual([]);
  });
});

describe('isAutoProvisionedService', () => {
  it('treats a creator-less service named after its own type as provisioned', () => {
    expect(
      isAutoProvisionedService({
        name: 'Agents',
        type: 'agents',
        created_by_id: null,
      })
    ).toBe(true);
  });

  it('never treats a service with a creator as provisioned', () => {
    expect(
      isAutoProvisionedService({
        name: 'db',
        type: 'sqlite',
        created_by_id: 1,
      })
    ).toBe(false);
  });
});
