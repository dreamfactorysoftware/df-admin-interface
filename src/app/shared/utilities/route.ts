import { Routes } from '@angular/router';
import { Nav } from '../types/nav';
import { ROUTES } from '../types/routes';

const filteredFromNav = [
  ROUTES.CREATE,
  ROUTES.IMPORT,
  ROUTES.EDIT,
  ROUTES.AUTH,
  ROUTES.PROFILE,
  ROUTES.VIEW,
  ROUTES.ERROR,
  ROUTES.LICENSE_EXPIRED,
];

const navIcons = [
  'home',
  'ai',
  'admin-settings',
  'api-connections',
  'api-security',
  'system-settings',
];

export function transformRoutes(routes: Routes, root = ''): Array<Nav> {
  return routes
    .filter(
      route =>
        route.path &&
        !route.path.includes(':') &&
        !filteredFromNav.includes(route.path as ROUTES)
    )
    .map(route => {
      if (route.children) {
        const subRoutes = transformRoutes(
          route.children,
          `${root}/${route.path}`
        );
        return {
          path: `${root}/${route.path}`,
          subRoutes: subRoutes.length ? subRoutes : undefined,
          route: route.path as ROUTES,
          icon: findIconForRoute(route as string),
        };
      }
      return {
        path: `${root}/${route.path}`,
        route: route.path as ROUTES,
        icon: findIconForRoute(route as string),
      };
    });
}

const findIconForRoute = (routeName: any) => {
  if (navIcons.includes(routeName.path)) {
    return `assets/img/nav/${routeName?.path}.svg`;
  } else {
    return '';
  }
};

export function accessibleRoutes(
  navs: Array<Nav>,
  allowedTabs: Array<string>
): Array<Nav> {
  const allowed: Array<ROUTES> = [ROUTES.SYSTEM_INFO, ROUTES.AI];
  allowedTabs?.forEach(tab => {
    switch (tab) {
      case 'apps':
        allowed.push(ROUTES.API_KEYS);
        break;
      case 'users':
        allowed.push(ROUTES.USERS);
        break;
      case 'roles':
        allowed.push(ROUTES.ROLE_BASED_ACCESS);
        break;
      case 'services':
        allowed.push(
          ROUTES.DATABASE,
          ROUTES.SCRIPTING,
          ROUTES.NETWORK,
          ROUTES.FILE,
          ROUTES.UTILITY,
          ROUTES.AUTHENTICATION,
          ROUTES.DF_PLATFORM_APIS
        );
        break;
      case 'apidocs':
        allowed.push(ROUTES.API_DOCS, ROUTES.DATA_EXPLORER);
        break;
      case 'schema/data':
        allowed.push(ROUTES.SCHEMA);
        break;
      case 'files':
        allowed.push(ROUTES.FILES);
        break;
      case 'scripts':
        allowed.push(ROUTES.EVENT_SCRIPTS);
        break;
      case 'config':
        allowed.push(
          ROUTES.CORS,
          ROUTES.CACHE,
          ROUTES.EMAIL_TEMPLATES,
          ROUTES.GLOBAL_LOOKUP_KEYS,
          ROUTES.INTERCOM
        );
        break;
      case 'limits':
        allowed.push(ROUTES.RATE_LIMITING);
        break;
      case 'scheduler':
        allowed.push(ROUTES.SCHEDULER);
        break;
    }
  });
  return navs.filter(nav => {
    if (nav.subRoutes) {
      nav.subRoutes = accessibleRoutes(nav.subRoutes, allowedTabs);
      return nav.subRoutes.length;
    }
    return allowed.includes(nav.route);
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
    .replace(/\/$/, '')
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
          const parts = currentSegment.split('-');
          const requiredText = parts[parts.length - 1];
          const breadcrumb: Breadcrumb = { label: requiredText };

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
  if (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1].path) {
    delete breadcrumbs[breadcrumbs.length - 1].path;
  }
  return breadcrumbs;
}
