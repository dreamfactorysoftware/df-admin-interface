import { ConfigSchema } from 'src/app/shared/types/service';

// Outbound OAuth2 (client credentials) config of the HTTP service (type
// `rws`), added to the backend in df-rws 635c244. DreamFactory uses these to
// fetch a bearer token for the remote API it proxies.
//
// Names are the camelCased form that getConfigSchema() gives the form. The
// case interceptor maps them back on save (oauthTokenUrl -> oauth_token_url),
// so the payload keys are the ones the backend defines.
//
// The order here is the order the panel shows them in.
export const BACKEND_AUTH_FIELD_NAMES: ReadonlyArray<string> = [
  'oauthTokenUrl',
  'oauthClientId',
  'oauthClientSecret',
  'oauthGrantType',
  'oauthScope',
  'oauthAuthMethod',
];

const TOKEN_URL = 'oauthTokenUrl';

// The backend turns outbound OAuth2 on only when all three hold a value
// (OAuth2ClientCredentials::isConfigured). A schema without all three is not
// this feature, so its fields are left where they were. The MCP service types
// carry oauth_client_id and oauth_client_secret for a different purpose and
// have no token URL: they must never match.
const CORE_FIELD_NAMES: ReadonlyArray<string> = [
  TOKEN_URL,
  'oauthClientId',
  'oauthClientSecret',
];

// Needed in addition to the token URL before the backend can get a token. The
// grant type is included because the backend posts the stored value as is, so
// an empty one fails at the token endpoint.
const REQUIRED_WITH_TOKEN_URL: ReadonlyArray<string> = [
  'oauthClientId',
  'oauthClientSecret',
  'oauthGrantType',
];

// The panel renders every field with df-dynamic-field. A field the backend
// ships as another type stays in Advanced Options, which can render it.
const PANEL_FIELD_TYPES: ReadonlyArray<string> = [
  'string',
  'text',
  'password',
  'picklist',
];

export type BackendAuthState = 'off' | 'on' | 'incomplete';

export function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  );
}

/**
 * The fields the Backend Authentication panel owns, in display order. Empty
 * when the schema does not carry the outbound OAuth2 feature, which leaves
 * the form exactly as it was.
 */
export function pickBackendAuthFields(
  schema: ReadonlyArray<ConfigSchema> | null | undefined
): Array<ConfigSchema> {
  if (!schema?.length) {
    return [];
  }
  const picked = BACKEND_AUTH_FIELD_NAMES.map(name =>
    schema.find(field => field.name === name)
  ).filter(
    (field): field is ConfigSchema =>
      !!field && PANEL_FIELD_TYPES.includes(field.type)
  );
  const hasCore = CORE_FIELD_NAMES.every(name =>
    picked.some(field => field.name === name)
  );
  return hasCore ? picked : [];
}

/**
 * Panel fields that are still empty although a token URL is set. Empty when
 * there is no token URL, because that is how outbound OAuth2 is turned off.
 */
export function missingBackendAuthFields(
  fields: ReadonlyArray<ConfigSchema>,
  valueOf: (name: string) => unknown
): Array<ConfigSchema> {
  if (!fields.length || isBlank(valueOf(TOKEN_URL))) {
    return [];
  }
  return fields.filter(
    field =>
      REQUIRED_WITH_TOKEN_URL.includes(field.name) &&
      isBlank(valueOf(field.name))
  );
}

export function backendAuthState(
  fields: ReadonlyArray<ConfigSchema>,
  valueOf: (name: string) => unknown
): BackendAuthState {
  if (!fields.length || isBlank(valueOf(TOKEN_URL))) {
    return 'off';
  }
  return missingBackendAuthFields(fields, valueOf).length ? 'incomplete' : 'on';
}

/**
 * Picklists that are empty and have a schema default, as [name, default]
 * pairs. Used when a token URL is entered on a service saved before these
 * columns existed: its grant type and auth method load as null, and the grant
 * type has to hold a value.
 */
export function backendAuthDefaultsToApply(
  fields: ReadonlyArray<ConfigSchema>,
  valueOf: (name: string) => unknown
): Array<[string, unknown]> {
  if (isBlank(valueOf(TOKEN_URL))) {
    return [];
  }
  return fields
    .filter(
      field =>
        field.type === 'picklist' &&
        !isBlank(field.default) &&
        isBlank(valueOf(field.name))
    )
    .map(field => [field.name, field.default] as [string, unknown]);
}
