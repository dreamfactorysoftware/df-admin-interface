/** Shared Jest helpers for the AAuth specs. */
import { Translation, TranslocoTestingModule } from '@ngneat/transloco';
import { AauthOverview, AauthScope, PlaygroundRun } from './aauth.types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AA: Translation = require('../../assets/i18n/aauth/en.json');

export function aauthTransloco() {
  return TranslocoTestingModule.forRoot({
    langs: { en: { aauth: AA } },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

export const ISSUER = 'https://df.example.test';

export function overview(over: Partial<AauthOverview> = {}): AauthOverview {
  return {
    enabled: true,
    issuer: ISSUER,
    issuerOk: true,
    urls: {
      resourceMetadata: `${ISSUER}/.well-known/aauth-resource.json`,
      personMetadata: `${ISSUER}/.well-known/aauth-person.json`,
      agentMetadata: `${ISSUER}/.well-known/aauth-agent.json`,
      interact: `${ISSUER}/aauth/interact`,
    },
    counts: {
      scopesEnabled: 2,
      personServers: 1,
      agents: 3,
      grants: 1,
      activity24h: 12,
    },
    ...over,
  };
}

export function scope(over: Partial<AauthScope> = {}): AauthScope {
  return {
    roleId: 1,
    roleName: 'Sales read',
    roleDescription: null,
    scope: 'sales.read',
    description: 'Read customers and orders',
    enabled: true,
    ...over,
  };
}

const utf8Binary = (text: string) =>
  encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );

const b64u = (v: unknown) =>
  btoa(utf8Binary(JSON.stringify(v)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export function jwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>
): string {
  return `${b64u(header)}.${b64u(payload)}.c2ln`;
}

export function run(over: Partial<PlaygroundRun> = {}): PlaygroundRun {
  return {
    runId: 'r1',
    status: 'done',
    pending: null,
    error: null,
    steps: [],
    result: null,
    ...over,
  };
}
