import { InjectionToken } from '@angular/core';
import { DfBaseCrudService } from '../services/df-base-crud.service';

export const URL_TOKEN = new InjectionToken<string>('URL_TOKEN');

export const DF_ADMIN_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'DF_ADMIN_SERVICE_TOKEN'
);
export const ADMIN_URL_TOKEN = new InjectionToken<string>('ADMIN_URL_TOKEN');

export const DF_USER_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'DF_USER_SERVICE_TOKEN'
);
export const USER_URL_TOKEN = new InjectionToken<string>('USER_URL_TOKEN');

export const DF_APPS_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'DF_APPS_SERVICE_TOKEN'
);
export const APPS_URL_TOKEN = new InjectionToken<string>('APPS_URL_TOKEN');

export const DF_REPORT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'DF_REPORT_SERVICE_TOKEN'
);

export const DF_LIMIT_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'DF_LIMIT_SERVICE_TOKEN'
);
export const LIMIT_URL_TOKEN = new InjectionToken<string>('LIMIT_URL_TOKEN');

export const DF_ROLE_SERVICE_TOKEN = new InjectionToken<DfBaseCrudService>(
  'DF_ROLE_SERVICE_TOKEN'
);
export const ROLE_URL_TOKEN = new InjectionToken<string>('ROLE_URL_TOKEN');
