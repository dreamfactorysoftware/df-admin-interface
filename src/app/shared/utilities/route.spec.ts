import { Routes } from '@angular/router';
import { ROUTES } from '../types/routes';
import { accessibleRoutes, generateBreadcrumb, transformRoutes } from './route';

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
});
