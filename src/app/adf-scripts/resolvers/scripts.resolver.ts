import { SCRIPT_TYPE_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { ScriptType } from '../types/df-scripts.types';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

export const scriptTypeResolver: ResolveFn<ScriptType> = () => {
  return inject(SCRIPT_TYPE_SERVICE_TOKEN).getAll();
};
