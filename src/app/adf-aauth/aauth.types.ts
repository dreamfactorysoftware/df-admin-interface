/**
 * Wire types for /api/v2/system/aauth (design contract 4.7), as seen after
 * the case interceptor camelCases response keys. Protocol artifacts never
 * travel as object keys: tokens are compact JWT strings and headers are
 * [name, value] pairs, so nothing here is rewritten by the interceptor.
 */

export interface AauthUrls {
  resourceMetadata: string;
  personMetadata: string;
  agentMetadata: string;
  interact: string;
}

export interface AauthCounts {
  scopesEnabled: number;
  personServers: number;
  agents: number;
  grants: number;
  activity24h: number;
}

export interface AauthOverview {
  enabled: boolean;
  issuer: string | null;
  issuerOk: boolean;
  urls: AauthUrls | null;
  counts: AauthCounts;
}

export interface AauthScope {
  roleId: number;
  roleName: string;
  roleDescription: string | null;
  scope: string;
  description: string | null;
  enabled: boolean;
}

export type ScopePatch = Partial<Pick<AauthScope, 'enabled' | 'scope'>> & {
  description?: string | null;
};

export interface PersonServer {
  id: number;
  issuer: string;
  name: string | null;
  isLocal: boolean;
  enabled: boolean;
  /** Allow-list; empty means none unless allScopes. */
  scopes: string[];
  /** Trusted for every enabled scope (explicit opt-in; the local PS has it). */
  allScopes: boolean;
  lastUsedAt: string | null;
}

export type PersonServerPatch = Partial<
  Pick<PersonServer, 'enabled' | 'scopes' | 'allScopes'>
>;

export interface ActivityPage {
  rows: ActivityRow[];
  hasMore: boolean;
}

export type AgentStatus = 'allowed' | 'blocked';

export interface AauthAgent {
  id: number;
  agentId: string;
  issuer: string;
  name: string | null;
  status: AgentStatus;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  requestCount: number;
}

export type ActivityOutcome =
  | 'allowed'
  | 'person_required'
  | 'auth_required'
  | 'denied'
  | 'blocked'
  | 'error';

export interface ActivityRow {
  id: number;
  createdAt: string;
  agentId: string;
  agentName: string | null;
  person: string | null;
  psIssuer: string | null;
  scope: string | null;
  method: string;
  path: string;
  status: number;
  outcome: ActivityOutcome;
  detail: string | null;
}

export interface AauthGrant {
  id: number;
  userId: number;
  userEmail: string | null;
  userName: string | null;
  resource: string;
  resourceName: string | null;
  agentSub: string;
  agentName: string | null;
  scope: string;
  createdAt: string;
  lastUsedAt: string | null;
}

// ------------------------------------------------------------- playground

export type HeaderPair = [string, string];

export interface PlaygroundRequest {
  method: string;
  url: string;
  headers: HeaderPair[];
  body: string | null;
}

export interface PlaygroundResponse {
  status: number;
  headers: HeaderPair[];
  body: string | null;
}

export type StepKind =
  | 'agent_token'
  | 'call'
  | 'discover'
  | 'person_token'
  | 'poll'
  | 'auth_token'
  | 'reuse';

export interface PlaygroundStep {
  kind: StepKind;
  title: string;
  request: PlaygroundRequest | null;
  response: PlaygroundResponse | null;
  tokens: string[];
}

export type RunStatus = 'running' | 'waiting' | 'done' | 'failed';

export interface PlaygroundRun {
  runId: string;
  status: RunStatus;
  pending: { code: string; url: string } | null;
  error: string | null;
  steps: PlaygroundStep[];
  result: { status: number; body: string | null } | null;
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface PlaygroundSend {
  method: HttpMethod;
  path: string;
  body?: string;
}
