import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { GenericListResponse } from 'src/app/shared/types/generic-http.type';
import { DF_SCHEDULER_SERVICE_TOKEN } from 'src/app/core/constants/tokens';
import { SchedulerTaskData } from '../df-manage-scheduler/df-manage-scheduler-table.component';

export const schedulerResolver: ResolveFn<
  GenericListResponse<Array<SchedulerTaskData>>
> = () => {
  return inject(DF_SCHEDULER_SERVICE_TOKEN).getAll();
};
