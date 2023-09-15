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
  API_DOCS_URL_TOKEN,
  API_DOCS_SERVICE_TOKEN,
  SERVICE_TYPE_URL_TOKEN,
  SERVICE_TYPE_SERVICE_TOKEN,
  EMAIL_TEMPLATES_URL_TOKEN,
  EMAIL_TEMPLATES_SERVICE_TOKEN,
  SERVICE_TYPES_URL_TOKEN,
  SERVICE_TYPES_SERVICE_TOKEN,
  LOOKUP_KEYS_URL_TOKEN,
  LOOKUP_KEYS_SERVICE_TOKEN,
  BASE_URL_TOKEN,
  BASE_SERVICE_TOKEN,
  SERVICES_URL_TOKEN,
  SERVICES_SERVICE_TOKEN,
  SCRIPTS_URL_TOKEN,
  SCRIPTS_SERVICE_TOKEN,
  SCRIPT_TYPE_URL_TOKEN,
  SCRIPT_TYPE_SERVICE_TOKEN,
  EVENT_SCRIPT_URL_TOKEN,
  EVENT_SCRIPT_SERVICE_TOKEN,
  GITHUB_REPO_URL_TOKEN,
  GITHUB_REPO_SERVICE_TOKEN,
} from './tokens';
import { BASE_URL, URLS } from './urls';

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

export const GITHUB_REPO_SERVICE_PROVIDERS = [
  {
    provide: GITHUB_REPO_URL_TOKEN,
    useValue: URLS.GITHUB_REPO,
  },
  {
    provide: GITHUB_REPO_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [GITHUB_REPO_URL_TOKEN, HttpClient],
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

export const API_DOCS_SERVICE_PROVIDERS = [
  {
    provide: API_DOCS_URL_TOKEN,
    useValue: URLS.API_DOCS,
  },
  {
    provide: API_DOCS_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [API_DOCS_URL_TOKEN, HttpClient],
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

export const SERVICES_SERVICE_PROVIDERS = [
  {
    provide: SERVICES_URL_TOKEN,
    useValue: URLS.SYSTEM_SERVICE,
  },
  {
    provide: SERVICES_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SERVICES_URL_TOKEN, HttpClient],
  },
];

export const SERVICE_TYPES_SERVICE_PROVIDERS = [
  {
    provide: SERVICE_TYPES_URL_TOKEN,
    useValue: URLS.SERVICE_TYPE,
  },
  {
    provide: SERVICE_TYPES_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SERVICE_TYPES_URL_TOKEN, HttpClient],
  },
];

export const SCRIPTS_SERVICE_PROVIDERS = [
  {
    provide: SCRIPTS_URL_TOKEN,
    useValue: URLS.SYSTEM_EVENT,
  },
  {
    provide: SCRIPTS_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SCRIPTS_URL_TOKEN, HttpClient],
  },
];

export const EVENT_SCRIPT_SERVICE_PROVIDERS = [
  {
    provide: EVENT_SCRIPT_URL_TOKEN,
    useValue: URLS.EVENT_SCRIPT,
  },
  {
    provide: EVENT_SCRIPT_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [EVENT_SCRIPT_URL_TOKEN, HttpClient],
  },
];

export const SCRIPT_TYPE_SERVICE_PROVIDERS = [
  {
    provide: SCRIPT_TYPE_URL_TOKEN,
    useValue: URLS.SCRIPT_TYPE,
  },
  {
    provide: SCRIPT_TYPE_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SCRIPT_TYPE_URL_TOKEN, HttpClient],
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

export const LOOKUP_KEYS_SERVICE_PROVIDERS = [
  {
    provide: LOOKUP_KEYS_URL_TOKEN,
    useValue: URLS.LOOKUP_KEYS,
  },
  {
    provide: LOOKUP_KEYS_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [LOOKUP_KEYS_URL_TOKEN, HttpClient],
  },
];
export const SERVICE_SERVICE_PROVIDERS = [
  {
    provide: SERVICES_URL_TOKEN,
    useValue: URLS.SYSTEM_SERVICE,
  },
  {
    provide: SERVICES_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SERVICES_URL_TOKEN, HttpClient],
  },
];

export const SERVICE_TYPE_SERVICE_PROVIDERS = [
  {
    provide: SERVICE_TYPE_URL_TOKEN,
    useValue: URLS.SERVICE_TYPE,
  },
  {
    provide: SERVICE_TYPE_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [SERVICE_TYPE_URL_TOKEN, HttpClient],
  },
];

export const BASE_SERVICE_PROVIDERS = [
  {
    provide: BASE_URL_TOKEN,
    useValue: BASE_URL,
  },
  {
    provide: BASE_SERVICE_TOKEN,
    useFactory: dfBaseCrudServiceFactory,
    deps: [BASE_URL_TOKEN, HttpClient],
  },
];
