import {
  ActivatedRouteSnapshot,
  UrlMatcher,
  UrlSegment,
} from '@angular/router';

/**
 * Tabs of the MCP server edit page and their route mapping.
 *
 * A tab is the optional last path segment after the service id
 * (`/ai/mcp/:id/<tab>`); no segment means the first tab. The service detail
 * route consumes that segment through `serviceDetailMatcher` so switching
 * tabs keeps the same route config (component reused, no resolver re-run,
 * Preview-as and loaded data untouched).
 */
export type McpTab =
  | 'exposure'
  | 'access'
  | 'tools'
  | 'connect'
  | 'custom'
  | 'activity';

export const MCP_TABS: ReadonlyArray<McpTab> = [
  'exposure',
  'access',
  'tools',
  'connect',
  'custom',
  'activity',
];

export function isMcpTab(value: unknown): value is McpTab {
  return typeof value === 'string' && (MCP_TABS as string[]).includes(value);
}

/** system_mcp has no exposure grid and no custom tools. */
export function tabsFor(systemMcp: boolean): McpTab[] {
  return systemMcp ? ['access', 'tools', 'connect', 'activity'] : [...MCP_TABS];
}

/** The tab a route param selects; unknown or missing falls back to the first. */
export function tabFromParam(
  param: string | null | undefined,
  systemMcp: boolean
): McpTab {
  const tabs = tabsFor(systemMcp);
  return isMcpTab(param) && tabs.includes(param) ? param : tabs[0];
}

/** The URL for `tab`, replacing any tab segment already on the URL. */
export function tabUrl(currentUrl: string, tab: McpTab): string {
  const [path, query] = currentUrl.split('?');
  const segments = path.split('/').filter(Boolean);
  if (isMcpTab(segments[segments.length - 1])) segments.pop();
  return `/${segments.join('/')}/${tab}${query ? `?${query}` : ''}`;
}

/**
 * Service detail route: `:id` plus an optional known tab segment, as ONE
 * route config. `create` stays its own route.
 */
export const serviceDetailMatcher: UrlMatcher = (segments: UrlSegment[]) => {
  if (segments.length === 0 || segments[0].path === 'create') return null;
  const consumed = [segments[0]];
  const posParams: Record<string, UrlSegment> = { id: segments[0] };
  if (segments.length > 1 && isMcpTab(segments[1].path)) {
    consumed.push(segments[1]);
    posParams['tab'] = segments[1];
  }
  return { consumed, posParams };
};

/** Re-run resolvers only when the service changes, not on a tab change. */
export function serviceChanged(
  from: ActivatedRouteSnapshot,
  to: ActivatedRouteSnapshot
): boolean {
  return from.params['id'] !== to.params['id'];
}
