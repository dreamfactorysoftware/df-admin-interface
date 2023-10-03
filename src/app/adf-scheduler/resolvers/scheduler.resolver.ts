import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { SCHEDULER_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { SchedulerTaskData } from '../../shared/types/scheduler';

export const schedulerResolver: ResolveFn<
  GenericListResponse<Array<SchedulerTaskData>> | SchedulerTaskData
> = (route: ActivatedRouteSnapshot) => {
  const id = route.paramMap.get('id');

  if (id)
    return inject(SCHEDULER_SERVICE_TOKEN).get(id, {
      related: 'task_log_by_task_id',
    });

  return inject(SCHEDULER_SERVICE_TOKEN).getAll({
    related: 'task_log_by_task_id,service_by_service_id',
  });
};
