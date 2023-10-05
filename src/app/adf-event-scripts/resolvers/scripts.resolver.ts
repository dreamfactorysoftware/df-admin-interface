import { EVENT_SCRIPT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { ScriptObject } from '../../shared/types/scripts';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';

export const eventScriptResolver: ResolveFn<ScriptObject> = (
  route: ActivatedRouteSnapshot
) => {
  const name = route.paramMap.get('name') ?? '';
  return inject(EVENT_SCRIPT_SERVICE_TOKEN).get<ScriptObject>(name);
};

export const eventScriptsResolver: ResolveFn<
  GenericListResponse<ScriptObject>
> = () => {
  return inject(EVENT_SCRIPT_SERVICE_TOKEN).getAll<
    GenericListResponse<ScriptObject>
  >();
};
