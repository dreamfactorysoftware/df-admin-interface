import { InjectionToken } from '@angular/core';
import { DfBaseCrudService } from '../services/df-base-crud.service';
import { UserProfile, CreateAdmin } from 'src/app/shared/types/user';
import { AppPayload, AppType } from 'src/app/adf-apps/types/df-apps.types';

export const URL_TOKEN = new InjectionToken<string>('URL_TOKEN');
export const RELATED_TOKEN = new InjectionToken<string>('RELATED_TOKEN');
export const MESSAGE_PREFIX_TOKEN = new InjectionToken<string>(
  'MESSAGE_PREFIX_TOKEN'
);

export const DF_ADMIN_SERVICE_TOKEN = new InjectionToken<
  DfBaseCrudService<UserProfile, CreateAdmin>
>('DF_ADMIN_SERVICE_TOKEN');
export const ADMIN_URL_TOKEN = new InjectionToken<string>('ADMIN_URL_TOKEN');
export const ADMIN_RELATED_TOKEN = new InjectionToken<string>(
  'ADMIN_RELATED_TOKEN'
);
export const ADMIN_MESSAGE_PREFIX_TOKEN = new InjectionToken<string>(
  'ADMIN_MESSAGE_PREFIX_TOKEN'
);

export const DF_USER_SERVICE_TOKEN = new InjectionToken<
  DfBaseCrudService<UserProfile, UserProfile>
>('DF_USER_SERVICE_TOKEN');
export const USER_URL_TOKEN = new InjectionToken<string>('USER_URL_TOKEN');
export const USER_RELATED_TOKEN = new InjectionToken<string>(
  'USER_RELATED_TOKEN'
);
export const USER_MESSAGE_PREFIX_TOKEN = new InjectionToken<string>(
  'USER_MESSAGE_PREFIX_TOKEN'
);

export const DF_APPS_SERVICE_TOKEN = new InjectionToken<
  DfBaseCrudService<AppType, AppPayload>
>('DF_APPS_SERVICE_TOKEN');
export const APPS_URL_TOKEN = new InjectionToken<string>('APPS_URL_TOKEN');
export const APPS_RELATED_TOKEN = new InjectionToken<string>(
  'APPS_RELATED_TOKEN'
);
export const APPS_MESSAGE_PREFIX_TOKEN = new InjectionToken<string>(
  'APPS_MESSAGE_PREFIX_TOKEN'
);
