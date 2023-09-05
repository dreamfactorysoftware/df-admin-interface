import { HttpClient } from '@angular/common/http';
import { dfBaseCrudServiceFactory } from '../services/df-base-crud.service';
import {
  ADMIN_URL_TOKEN,
  ADMIN_SERVICE_TOKEN,
  ROLE_URL_TOKEN,
  ROLE_SERVICE_TOKEN,
  USER_URL_TOKEN,
  USER_SERVICE_TOKEN,
  APP_URL_TOKEN,
  APP_SERVICE_TOKEN,
  REPORT_URL_TOKEN,
  REPORT_SERVICE_TOKEN,
  LIMIT_URL_TOKEN,
  LIMIT_SERVICE_TOKEN,
  CONFIG_CORS_URL_TOKEN,
  CONFIG_CORS_SERVICE_TOKEN,
  SCHEDULER_URL_TOKEN,
  SCHEDULER_SERVICE_TOKEN,
  LIMIT_CACHE_URL_TOKEN,
  LIMIT_CACHE_SERVICE_TOKEN,
  CACHE_URL_TOKEN,
  CACHE_SERVICE_TOKEN,
  EMAIL_TEMPLATES_URL_TOKEN,
  EMAIL_TEMPLATES_SERVICE_TOKEN,
} from './tokens';
import { URLS } from './urls';

export const ADMIN_SERVICE_PROVIDERS = [
  {
    provide: ADMIN_URL_TOKEN,
    useValue: URLS.SYSTEM_ADMIN,
  },
  {
    provide: ADMIN_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [ADMIN_URL_TOKEN, HttpClient],
  },
];

export const ROLE_SERVICE_PROVIDERS = [
  {
    provide: ROLE_URL_TOKEN,
    useValue: URLS.ROLES,
  },
  {
    provide: ROLE_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [ROLE_URL_TOKEN, HttpClient],
  },
];

export const USER_SERVICE_PROVIDERS = [
  {
    provide: USER_URL_TOKEN,
    useValue: URLS.SYSTEM_USER,
  },
  {
    provide: USER_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [USER_URL_TOKEN, HttpClient],
  },
];

export const APP_SERVICE_PROVIDERS = [
  {
    provide: APP_URL_TOKEN,
    useValue: URLS.APP,
  },
  {
    provide: APP_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [APP_URL_TOKEN, HttpClient],
  },
];

export const REPORT_SERVICE_PROVIDERS = [
  {
    provide: REPORT_URL_TOKEN,
    useValue: URLS.SERVICE_REPORT,
  },
  {
    provide: REPORT_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [REPORT_URL_TOKEN, HttpClient],
  },
];

export const CORS_CONFIG_SERVICE_PROVIDERS = [
  {
    provide: CONFIG_CORS_URL_TOKEN,
    useValue: URLS.SYSTEM_CORS,
  },
  {
    provide: CONFIG_CORS_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [CONFIG_CORS_URL_TOKEN, HttpClient],
  },
];

export const LIMIT_SERVICE_PROVIDERS = [
  {
    provide: LIMIT_URL_TOKEN,
    useValue: URLS.LIMITS,
  },
  {
    provide: LIMIT_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [LIMIT_URL_TOKEN, HttpClient],
  },
];

export const SCHEDULER_SERVICE_PROVIDER = [
  {
    provide: SCHEDULER_URL_TOKEN,
    useValue: URLS.SCHEDULER,
  },
  {
    provide: SCHEDULER_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SCHEDULER_URL_TOKEN, HttpClient],
  },
];

export const LIMIT_CACHE_SERVICE_PROVIDERS = [
  {
    provide: LIMIT_CACHE_URL_TOKEN,
    useValue: URLS.LIMIT_CACHE,
  },
  {
    provide: LIMIT_CACHE_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [LIMIT_CACHE_URL_TOKEN, HttpClient],
  },
];

export const CACHE_SERVICE_PROVIDERS = [
  {
    provide: CACHE_URL_TOKEN,
    useValue: URLS.SYSTEM_CACHE,
  },
  {
    provide: CACHE_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [CACHE_URL_TOKEN, HttpClient],
  },
];

export const EMAIL_TEMPLATES_SERVICE_PROVIDERS = [
  {
    provide: EMAIL_TEMPLATES_URL_TOKEN,
    useValue: URLS.EMAIL_TEMPLATES,
  },
  {
    provide: EMAIL_TEMPLATES_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [EMAIL_TEMPLATES_URL_TOKEN, HttpClient],
  },
];
