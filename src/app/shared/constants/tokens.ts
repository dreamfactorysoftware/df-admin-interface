import { InjectionToken, inject } from '@angular/core';
import { DfBaseCrudService } from '../services/df-base-crud.service';
import { BASE_URL, URLS } from './urls';
import { HttpClient } from '@angular/common/http';

const dfBaseCrudServiceProvider = (
  url: string
): {
  providedIn: 'root' | 'platform' | 'any' | null;
  factory: () => DfBaseCrudService;
} => ({
  providedIn: 'root',
  factory: () => new DfBaseCrudService(url, inject(HttpClient)),
});

export const URL_TOKEN = new InjectionToken<string>('URL_TOKEN');

export const GITHUB_REPO_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'GITHUB_REPO_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.GITHUB_REPO)
);

export const ADMIN_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'ADMIN_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SYSTEM_ADMIN)
);

export const USER_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'USER_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SYSTEM_USER)
);

export const APP_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'APP_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.APP)
);

export const API_DOCS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'API_DOCS_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.API_DOCS)
);

export const SERVICE_TYPE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'SERVICE_TYPE_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SERVICE_TYPE)
);

export const REPORT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'REPORT_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SERVICE_REPORT)
);

export const SERVICES_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'SERVICES_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SYSTEM_SERVICE)
);

export const SCHEDULER_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'SCHEDULER_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SCHEDULER)
);

export const LIMIT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'LIMIT_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.LIMITS)
);

export const LIMIT_CACHE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'LIMIT_CACHE_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.LIMIT_CACHE)
);

export const ROLE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'ROLE_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.ROLES)
);

export const CONFIG_CORS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'CONFIG_CORS_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SYSTEM_CORS)
);

export const EVENTS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'EVENTS_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SYSTEM_EVENT)
);

export const EVENT_SCRIPT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'EVENT_SCRIPT_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.EVENT_SCRIPT)
);

export const CACHE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'CACHE_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.SYSTEM_CACHE)
);

export const EMAIL_TEMPLATES_SERVICE_TOKEN =
  new InjectionToken<DfBaseCrudService>(
    'EMAIL_TEMPLATES_SERVICE_TOKEN',
    dfBaseCrudServiceProvider(URLS.EMAIL_TEMPLATES)
  );

export const LOOKUP_KEYS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'LOOKUP_KEYS_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.LOOKUP_KEYS)
);

export const BASE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'BASE_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(BASE_URL)
);

export const FILE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'FILE_SERVICE_TOKEN',
  dfBaseCrudServiceProvider(URLS.FILES)
);
