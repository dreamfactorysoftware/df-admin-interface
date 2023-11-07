import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { SchedulerTaskData } from '../../shared/types/scheduler';
import { DfPaywallService } from 'src/app/shared/services/df-paywall.service';
import { of, switchMap } from 'rxjs';

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
        if (id)
          return schedulerService.get<SchedulerTaskData>(id, {
            related: 'task_log_by_task_id',
          });

        return schedulerService.getAll<GenericListResponse<SchedulerTaskData>>({
          related: 'task_log_by_task_id,service_by_service_id',
        });
      }
    })
  );
};
