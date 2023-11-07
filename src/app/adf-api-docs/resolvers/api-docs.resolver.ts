import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { API_DOCS_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';

export const apiDocResolver: ResolveFn<any> = (
  route: ActivatedRouteSnapshot
) => {
  const serviceName = route.paramMap.get('name') as string;
  return inject(API_DOCS_SERVICE_TOKEN).get(serviceName);
};
