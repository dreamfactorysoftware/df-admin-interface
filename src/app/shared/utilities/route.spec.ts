import { Routes } from '@angular/router';
import { ROUTES } from '../types/routes';
import {
  accessibleRoutes,
  generateBreadcrumb,
  recordLabelFromRouteData,
  transformRoutes,
} from './route';

describe('Route Utilities', () => {
  it('should transform and filter Angular routes', () => {
    const routes: Routes = [
      { path: ROUTES.CREATE },
      { path: 'test', children: [{ path: 'child' }] },
    ];

    const result = transformRoutes(routes);

    expect(result).toEqual([
      {
        path: '/test',
        route: 'test',
        subRoutes: [{ path: '/test/child', route: 'child' }],
      },
    ]);
  });

  it('should filter and transform routes based on allowed tabs', () => {
    const navs = [
      { path: '/api-keys', route: ROUTES.API_KEYS },
      { path: '/users', route: ROUTES.USERS },
    ];

    const result = accessibleRoutes(navs, ['apps', 'users']);

    expect(result).toEqual([
      { path: '/api-keys', route: ROUTES.API_KEYS },
      { path: '/users', route: ROUTES.USERS },
    ]);
  });

  it('should generate breadcrumbs based on the current URL', () => {
    const routes: Routes = [{ path: 'test', children: [{ path: 'child' }] }];

    const result = generateBreadcrumb(routes, '/test/child');

    expect(result).toEqual([
      { label: 'test', path: 'test', translationKey: 'nav.test.header' },
      {
        label: 'child',
        translationKey: 'nav.test.child.header',
      },
    ]);
  });

  it('should keep a hyphenated dynamic segment whole', () => {
    const routes: Routes = [{ path: 'test', children: [{ path: ':name' }] }];

    const result = generateBreadcrumb(routes, '/test/my-mysql-db');

    expect(result[1]).toEqual({ label: 'my-mysql-db' });
  });

  describe('recordLabelFromRouteData', () => {
    it('should read the record name resolved under `data`', () => {
      expect(
        recordLabelFromRouteData({
          type: 'edit',
          data: { id: 7, name: 'my-limit' },
          services: { resource: [{ id: 1, name: 'db' }] },
        })
      ).toBe('my-limit');
    });

    it('should prefer the record keys over a co-resolved list', () => {
      expect(
        recordLabelFromRouteData({
          roles: { resource: [{ id: 1, name: 'role' }] },
          appData: { id: 3, name: 'my-api-key' },
        })
      ).toBe('my-api-key');
    });

    it('should fall back to email when the record has no name', () => {
      expect(
        recordLabelFromRouteData({ data: { id: 3, email: 'a@b.com' } })
      ).toBe('a@b.com');
    });

    it('should return undefined for list payloads and sentinels', () => {
      expect(
        recordLabelFromRouteData({ data: { resource: [{ name: 'db' }] } })
      ).toBeUndefined();
      expect(recordLabelFromRouteData({ data: 'paywall' })).toBeUndefined();
      expect(recordLabelFromRouteData(undefined)).toBeUndefined();
    });
  });
});
