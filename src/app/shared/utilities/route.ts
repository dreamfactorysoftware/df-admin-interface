import { Routes } from '@angular/router';
import { Nav } from '../types/nav';

export function transformRoutes(routes: Routes, root = '') {
  return routes
    .filter(
      route =>
        route.path &&
        ![
          'CREATE',
          'IMPORT',
          'EDIT',
          'AUTH',
          'PROFILE',
          'VIEW',
          'ERROR',
        ].includes(route.path.split('/')[0].toUpperCase()) &&
        route.path !== '' &&
        !route.path.includes(':')
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

type Breadcrumb = {
  label: string;
  path?: string;
  translationKey?: string;
};

export function generateBreadcrumb(
  routeTable: Routes,
  currentURL: string
): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [];
  const urlSegments = decodeURIComponent(currentURL)
    .split('/')
    .filter(segment => segment);

  function traverseRoutes(
    routes: Routes,
    pathSoFar: string[] = [],
    translationKeySoFar: string[] = [],
    index = 0
  ): boolean {
    if (index === urlSegments.length) {
      return true;
    }

    let matched = false;
    for (const route of routes) {
      const path = route.path as string;
      const isDynamic = path.startsWith(':');
      const currentSegment = isDynamic ? urlSegments[index] : path;
      const newPath = [...pathSoFar, currentSegment];

      if (route.path === urlSegments[index] || isDynamic) {
        matched = true;
        if (
          route.children &&
          route.children.some(child => child.path === '' && child.redirectTo)
        ) {
          if (
            traverseRoutes(
              route.children,
              newPath,
              [...translationKeySoFar, path],
              index + 1
            )
          ) {
            return true;
          }
        } else {
          const translationKeySegment = isDynamic ? path.slice(1) : path;
          const translationKey = [...translationKeySoFar, translationKeySegment]
            .join('.')
            .replace(/\//g, '.');
          const breadcrumb: Breadcrumb = { label: currentSegment };

          if (index !== urlSegments.length - 1) {
            breadcrumb.path = newPath.join('/');
          }

          if (!isDynamic) {
            breadcrumb.translationKey = `nav.${translationKey}.header`;
          }

          breadcrumbs.push(breadcrumb);
          if (
            traverseRoutes(
              route.children || [],
              newPath,
              [...translationKeySoFar, translationKeySegment],
              index + 1
            )
          ) {
            return true;
          }
        }
      }
    }

    // If no route matched the current segment, add the segment as a breadcrumb
    if (!matched) {
      breadcrumbs.push({
        label: urlSegments[index],
        path: [...pathSoFar, urlSegments[index]].join('/'),
      });
      return traverseRoutes(
        routes,
        [...pathSoFar, urlSegments[index]],
        translationKeySoFar,
        index + 1
      );
    }

    return false;
  }

  traverseRoutes(routeTable);
  return breadcrumbs;
}
