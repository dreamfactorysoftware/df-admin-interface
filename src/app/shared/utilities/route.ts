import { Routes } from '@angular/router';
import { Nav } from '../types/nav';
import { ROUTES } from '../types/routes';

const filteredFromNav = [
  ROUTES.CREATE,
  ROUTES.IMPORT,
  ROUTES.EDIT,
  ROUTES.AUTH,
  ROUTES.AI_SETUP,
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
  'api-builder',
  'agents',
  'alerts',
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
      const navMetadata = {
        ...(route.data?.['navLinkPath']
          ? { linkPath: route.data['navLinkPath'] }
          : {}),
        ...(route.data?.['navLabelPath']
          ? { labelPath: route.data['navLabelPath'] }
          : {}),
      };
      // FB4: only top-level pillars carry an icon. A route named like a pillar
      // (e.g. api-builder under api-types) must render icon-less when it sits
      // nested, matching every other nested sibling. root === '' == top level.
      const icon = root === '' ? findIconForRoute(route as string) : '';
      if (route.children) {
        const subRoutes = transformRoutes(
          route.children,
          `${root}/${route.path}`
        );
        return {
          path: `${root}/${route.path}`,
          ...navMetadata,
          subRoutes: subRoutes.length ? subRoutes : undefined,
          route: route.path as ROUTES,
          icon,
        };
      }
      return {
        path: `${root}/${route.path}`,
        ...navMetadata,
        route: route.path as ROUTES,
        icon,
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
  const allowed: Array<ROUTES> = [
    ROUTES.SYSTEM_INFO,
    ROUTES.AI,
    ROUTES.AI_SETUP,
    ROUTES.AI_CONNECTIONS,
    ROUTES.AI_CHAT_SERVICES,
    ROUTES.AI_CHAT_UI,
    ROUTES.AI_USAGE,
    ROUTES.AI_MCP,
  ];
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
        allowed.push(ROUTES.FILES, ROUTES.FILE_LOGS);
        break;
      case 'scripts':
        allowed.push(ROUTES.EVENT_SCRIPTS);
        break;
      case 'config':
        allowed.push(
          ROUTES.CORS,
          ROUTES.CACHE,
          ROUTES.CONFIG_PACKAGE,
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

export type Breadcrumb = {
  label: string;
  path?: string;
  translationKey?: string;
};

/** Fields a resolved record may carry its human-readable label under. */
const RECORD_LABEL_FIELDS = ['name', 'label', 'email', 'username'];

/**
 * Keys the detail resolvers register their record under, checked before the
 * rest of the route data so a co-resolved list (roles, services) can never win.
 */
const RECORD_DATA_KEYS = ['data', 'appData'];

/**
 * Pulls the display label out of a detail route's resolved data.
 *
 * Every `:id` route resolves the record it is editing (roleResolver,
 * editAppResolver, limitsResolver, schedulerResolver, adminsResolver,
 * userResolver ...), so the name is already in memory by the time the route
 * activates - no extra request. List payloads (`{ resource: [...] }`) and
 * paywall sentinels carry none of the label fields and are skipped, leaving
 * the caller to fall back to the raw URL segment.
 */
export function recordLabelFromRouteData(
  data: Record<string, any> | null | undefined
): string | undefined {
  if (!data) {
    return undefined;
  }
  const candidates = [
    ...RECORD_DATA_KEYS.map(key => data[key]),
    ...Object.entries(data)
      .filter(([key]) => !RECORD_DATA_KEYS.includes(key))
      .map(([, value]) => value),
  ];
  for (const candidate of candidates) {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      Array.isArray(candidate)
    ) {
      continue;
    }
    for (const field of RECORD_LABEL_FIELDS) {
      const label = candidate[field];
      if (typeof label === 'string' && label.trim()) {
        return label;
      }
    }
  }
  return undefined;
}

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
          // A dynamic segment is the record's own identifier (`:name`, `:id`)
          // and has to render whole - splitting on '-' and keeping the tail
          // turned a service named "my-mysql-db" into "db". Static segments
          // render from translationKey below, so their label is a fallback.
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
