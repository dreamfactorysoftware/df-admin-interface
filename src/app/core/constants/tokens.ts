import { InjectionToken } from '@angular/core';
import { DfBaseCrudService } from '../services/df-base-crud.service';

export const URL_TOKEN = new InjectionToken<string>('URL_TOKEN');

export const ADMIN_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'ADMIN_SERVICE_TOKEN'
);
export const ADMIN_URL_TOKEN = new InjectionToken<string>('ADMIN_URL_TOKEN');

export const USER_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'USER_SERVICE_TOKEN'
);
export const USER_URL_TOKEN = new InjectionToken<string>('USER_URL_TOKEN');

export const APP_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'APP_SERVICE_TOKEN'
);
export const APP_URL_TOKEN = new InjectionToken<string>('APP_URL_TOKEN');

export const API_DOCS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'API_DOCS_SERVICE_TOKEN'
);
export const API_DOCS_URL_TOKEN = new InjectionToken<string>(
  'API_DOCS_URL_TOKEN'
);

export const SERVICE_TYPE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'SERVICE_TYPE_SERVICE_TOKEN'
);

export const SERVICE_TYPE_URL_TOKEN = new InjectionToken<string>(
  'SERVICE_TYPE_URL_TOKEN'
);

export const REPORT_URL_TOKEN = new InjectionToken<string>('REPORT_URL_TOKEN');
export const REPORT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'REPORT_SERVICE_TOKEN'
);

export const SCHEDULER_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'SCHEDULER_SERVICE_TOKEN'
);

export const SCHEDULER_URL_TOKEN = new InjectionToken<DfBaseCrudService>(
  'SCHEDULER_URL_TOKEN'
);

export const LIMIT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'LIMIT_SERVICE_TOKEN'
);
export const LIMIT_URL_TOKEN = new InjectionToken<string>('LIMIT_URL_TOKEN');

export const LIMIT_CACHE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'LIMIT_CACHE_SERVICE_TOKEN'
);
export const LIMIT_CACHE_URL_TOKEN = new InjectionToken<string>(
  'LIMIT_CACHE_URL_TOKEN'
);

export const ROLE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'ROLE_SERVICE_TOKEN'
);
export const ROLE_URL_TOKEN = new InjectionToken<string>('ROLE_URL_TOKEN');

export const CONFIG_CORS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'CONFIG_CORS_SERVICE_TOKEN'
);
export const CONFIG_CORS_URL_TOKEN = new InjectionToken<string>(
  'CONFIG_CORS_URL_TOKEN'
);
export const CACHE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'CACHE_SERVICE_TOKEN'
);
export const CACHE_URL_TOKEN = new InjectionToken<string>('CACHE_URL_TOKEN');

export const EMAIL_TEMPLATES_SERVICE_TOKEN =
  new InjectionToken<DfBaseCrudService>('EMAIL_TEMPLATES_SERVICE_TOKEN');
export const EMAIL_TEMPLATES_URL_TOKEN = new InjectionToken<string>(
  'EMAIL_TEMPLATES_URL_TOKEN'
);
