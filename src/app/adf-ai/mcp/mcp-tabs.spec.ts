import { ActivatedRouteSnapshot, UrlSegment } from '@angular/router';
import {
  MCP_TABS,
  serviceChanged,
  serviceDetailMatcher,
  tabFromParam,
  tabUrl,
  tabsFor,
} from './mcp-tabs';

const seg = (path: string) => new UrlSegment(path, {});

describe('mcp-tabs', () => {
  it('lists six tabs for mcp and four for system_mcp (no exposure, no custom)', () => {
    expect(tabsFor(false)).toEqual(MCP_TABS);
    expect(tabsFor(true)).toEqual(['access', 'tools', 'connect', 'activity']);
  });

  it('maps a route param to a tab, defaulting to the first available', () => {
    expect(tabFromParam('access', false)).toBe('access');
    expect(tabFromParam(null, false)).toBe('exposure');
    expect(tabFromParam('bogus', false)).toBe('exposure');
    expect(tabFromParam('exposure', true)).toBe('access');
    expect(tabFromParam(undefined, true)).toBe('access');
  });

  it('builds a tab URL, replacing an existing tab segment and keeping the query', () => {
    expect(tabUrl('/ai/mcp/54', 'access')).toBe('/ai/mcp/54/access');
    expect(tabUrl('/ai/mcp/54/access', 'connect')).toBe('/ai/mcp/54/connect');
    expect(tabUrl('/ai/mcp/54/tools?x=1', 'activity')).toBe(
      '/ai/mcp/54/activity?x=1'
    );
  });

  it('matches :id with an optional known tab segment as one route', () => {
    expect(
      serviceDetailMatcher([seg('54')], null as never, null as never)
    ).toEqual({
      consumed: [seg('54')],
      posParams: { id: seg('54') },
    });
    const withTab = serviceDetailMatcher(
      [seg('54'), seg('access')],
      null as never,
      null as never
    );
    expect(withTab?.consumed.map(s => s.path)).toEqual(['54', 'access']);
    expect(withTab?.posParams?.['tab'].path).toBe('access');
    // an unknown second segment is left for the router (no match, as before)
    const extra = serviceDetailMatcher(
      [seg('54'), seg('other')],
      null as never,
      null as never
    );
    expect(extra?.consumed.map(s => s.path)).toEqual(['54']);
    expect(
      serviceDetailMatcher([seg('create')], null as never, null as never)
    ).toBeNull();
    expect(serviceDetailMatcher([], null as never, null as never)).toBeNull();
  });

  it('re-runs resolvers only when the service id changes', () => {
    const snap = (params: Record<string, string>) =>
      ({ params }) as unknown as ActivatedRouteSnapshot;
    expect(
      serviceChanged(snap({ id: '54' }), snap({ id: '54', tab: 'access' }))
    ).toBe(false);
    expect(serviceChanged(snap({ id: '54' }), snap({ id: '64' }))).toBe(true);
  });
});
