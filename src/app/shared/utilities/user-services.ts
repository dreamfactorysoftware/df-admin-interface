/** The service fields the user/auto-provisioned split reads. */
export interface ServiceOrigin {
  name: string;
  type?: string;
  // caseInterceptor camelCases /api responses, so the app sees createdById;
  // created_by_id covers rows that skipped the interceptor.
  createdById?: number | null;
  created_by_id?: number | null;
}

// Services the installer seeds, plus the legacy names the UI always excluded.
const SEEDED_SERVICE_NAMES = new Set([
  'system',
  'api_docs',
  'files',
  'logs',
  'db',
  'email',
  'user',
  'script',
  'ui',
  'schema',
  'api_doc',
  'file',
  'log',
  'admin',
  'df-admin',
  'dreamfactory',
  'cache',
  'push',
  'pub_sub',
]);

/**
 * True for a service DreamFactory provisioned itself, which never counts as one
 * of the user's APIs (Home counts, first-API onboarding).
 *
 * A service with a creator (createdById) always counts. A null creator alone
 * proves nothing: API Builder APIs, config-package or sessionless imports and
 * API-key-only calls leave it null too. A creator-less service is
 * auto-provisioned when it has a seeded name, or is a package's management
 * service, which installers name after its own type (api_builder, agents;
 * system and user follow the same convention). That covers future management
 * services without another name list to keep in sync.
 */
export function isAutoProvisionedService(service: ServiceOrigin): boolean {
  const creator = service.createdById ?? service.created_by_id;
  if (creator != null) {
    return false;
  }
  const name = service.name.toLowerCase();
  return SEEDED_SERVICE_NAMES.has(name) || name === service.type?.toLowerCase();
}

/** The services a user created (see isAutoProvisionedService). */
export function filterUserServices<T extends ServiceOrigin>(
  services: ReadonlyArray<T> | null | undefined
): T[] {
  return (services ?? []).filter(
    s => !!s?.name && !isAutoProvisionedService(s)
  );
}
