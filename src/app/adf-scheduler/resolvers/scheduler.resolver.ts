import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { SchedulerTaskData } from '../types/df-scheduler.types';

export const schedulerResolver: ResolveFn<
  GenericListResponse<Array<SchedulerTaskData>> | SchedulerTaskData
> = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id');

  if (id)
    return inject(SCHEDULER_SERVICE_TOKEN).get(id, {
      related: 'task_log_by_task_id',
    });

  return inject(SCHEDULER_SERVICE_TOKEN).getAll({
    related: 'task_log_by_task_id',
  });
};
