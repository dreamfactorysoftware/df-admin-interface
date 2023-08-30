import { Routes } from '@angular/router';
import { Nav } from '../types/nav';

export function transformRoutes(routes: Routes, root = '') {
  return routes
    .filter(
      route =>
        route.path &&
        !['CREATE', 'IMPORT', 'EDIT', 'AUTH', 'PROFILE'].includes(
          route.path.split('/')[0].toUpperCase()
        ) &&
        route.path !== ''
    )
    .map(route => {
      const transformed: Nav = { route: `${root}/${route.path}` };
      if (route.children) {
        const subroutes = transformRoutes(route.children, transformed.route);
        if (subroutes.length > 0) {
          transformed.subRoutes = subroutes;
        }
      }
      return transformed;
    });
}
