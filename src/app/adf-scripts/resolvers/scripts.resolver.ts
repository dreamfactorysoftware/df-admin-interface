import { SCRIPT_TYPE_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { ScriptType } from '../types/df-scripts.types';
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';

export const scriptTypeResolver: ResolveFn<ScriptType> = (
  route: ActivatedRouteSnapshot
) => {
  return inject(SCRIPT_TYPE_SERVICE_TOKEN).getAll();
};
