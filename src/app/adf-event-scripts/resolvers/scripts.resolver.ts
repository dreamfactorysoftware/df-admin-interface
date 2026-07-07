import { EVENT_SCRIPT_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { ScriptObject } from '../../shared/types/scripts';
import { inject } from '@angular/core';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { catchError, of, switchMap } from 'rxjs';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';

export const eventScriptResolver: ResolveFn<ScriptObject | string> = (
  route: ActivatedRouteSnapshot
) => {
  const name = route.paramMap.get('name') ?? '';
  const eventScriptService = inject(EVENT_SCRIPT_SERVICE_TOKEN);
  return eventScriptService.get<ScriptObject>(name);
};

export const eventScriptsResolver: ResolveFn<
  GenericListResponse<ScriptObject> | string
> = () => {
  const paywallService = inject(DfPaywallService);
  const eventScriptService = inject(EVENT_SCRIPT_SERVICE_TOKEN);
  return paywallService.activatePaywall(['script_Type', 'event_script']).pipe(
    switchMap(activated => {
      if (activated) {
        return of('paywall');
      } else {
        // List branch only: complete navigation on failure so the table
        // shell renders the error state with Retry.
        return eventScriptService
          .getAll<GenericListResponse<ScriptObject>>()
          .pipe(catchError(err => of(emptyListWithError(err))));
      }
    })
  );
};
