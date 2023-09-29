import {
  EVENT_SCRIPT_SERVICE_TOKEN,
  SCRIPT_TYPE_SERVICE_TOKEN,
} from 'src/app/shared/constants/tokens';
import { ScriptObject, ScriptType } from '../types/df-scripts.types';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';

export const scriptTypeResolver: ResolveFn<ScriptType> = () => {
  return inject(SCRIPT_TYPE_SERVICE_TOKEN).getAll();
};

export const eventScriptsResolver: ResolveFn<
  GenericListResponse<ScriptObject>
> = () => {
  return inject(EVENT_SCRIPT_SERVICE_TOKEN).getAll<
    GenericListResponse<ScriptObject>
  >();
};
