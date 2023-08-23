import { Nav } from 'src/app/shared/types/nav';

export enum ROUTES {
  AUTH = 'auth',
  HOME = 'home',
  LOGIN = 'login',
  LAUNCHPAD = 'launchpad',
  SERVICES = 'services',
  APPS = 'apps',
  ADMINS = 'admins',
  USERS = 'users',
  ROLES = 'roles',
  APIDOCS = 'api-docs',
  SCHEMAS = 'schema',
  DATA = 'data',
  FILES = 'files',
  SCRIPTS = 'scripts',
  CONFIG = 'config',
  PACKAGES = 'package-manager',
  LIMITS = 'limits',
  SCHEDULER = 'scheduler',
  REPORTS = 'reports',
  RESET_PASSWORD = 'reset-password',
  FORGOT_PASSWORD = 'forgot-password',
  REGISTER = 'register',
  USER_INVITE = 'user-invite',
  WELCOME = 'welcome',
  QUICKSTART = 'quickstart',
  RESOURCES = 'resources',
  DOWNLOAD = 'download',
  REGISTER_CONFIRM = 'register-confirm',
  MANAGE = 'manage',
  IMPORT = 'import',
  PROFILE = 'profile',
  EDIT = 'edit',
  CREATE = 'create',
}

export const NAV: Array<Nav> = [
  {
    route: ROUTES.HOME,
    subRoutes: [
      {
        route: ROUTES.WELCOME,
      },
      {
        route: ROUTES.QUICKSTART,
      },
      {
        route: ROUTES.RESOURCES,
      },
      {
        route: ROUTES.DOWNLOAD,
      },
    ],
  },
  {
    route: ROUTES.SERVICES,
  },
  {
    route: ROUTES.APPS,
  },
  {
    route: ROUTES.ADMINS,
  },
  {
    route: ROUTES.USERS,
  },
  {
    route: ROUTES.ROLES,
  },
  {
    route: ROUTES.APIDOCS,
  },
  {
    route: ROUTES.SCHEMAS,
  },
  {
    route: ROUTES.DATA,
  },
  {
    route: ROUTES.FILES,
  },
  {
    route: ROUTES.SCRIPTS,
  },
  {
    route: ROUTES.CONFIG,
  },
  {
    route: ROUTES.PACKAGES,
  },
  {
    route: ROUTES.LIMITS,
  },
  {
    route: ROUTES.SCHEDULER,
  },
  {
    route: ROUTES.REPORTS,
  },
];
