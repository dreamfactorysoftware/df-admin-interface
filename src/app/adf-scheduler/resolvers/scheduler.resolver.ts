import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { SchedulerTaskData } from '../../shared/types/scheduler';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { catchError, of, switchMap } from 'rxjs';
import { emptyListWithError } from 'src/app/shared/utilities/app-error';

export const schedulerResolver: ResolveFn<
  GenericListResponse<SchedulerTaskData> | SchedulerTaskData | string
> = (route: ActivatedRouteSnapshot) => {
  const paywallService = inject(DfPaywallService);
  const schedulerService = inject(SCHEDULER_SERVICE_TOKEN);
  return paywallService.activatePaywall('scheduler').pipe(
    switchMap(activated => {
      if (activated) {
        return of('paywall');
      } else {
        const id = route.paramMap.get('id');
        // Run history is NOT requested here. A df-scheduler without that
        // relation answers 400 "Unknown relationship" and the edit page
        // would not open. The details component loads runs on demand, and
        // only when the task carries run_status (see runsSupported there).
        if (id)
          return schedulerService.get<SchedulerTaskData>(id, {
            related: 'task_log_by_task_id',
          });

        // List branch only: complete navigation on failure so the table
        // shell renders the error state with Retry. The detail branch above
        // keeps its own error contract.
        return schedulerService
          .getAll<GenericListResponse<SchedulerTaskData>>({
            related: 'task_log_by_task_id,service_by_service_id',
          })
          .pipe(catchError(err => of(emptyListWithError(err))));
      }
    })
  );
};
