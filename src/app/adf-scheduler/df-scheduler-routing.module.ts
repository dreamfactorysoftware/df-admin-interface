import { NgModule } from '@angular/core';
import { DfManageSchedulerTableComponent } from './df-manage-scheduler/df-manage-scheduler-table.component';
import { schedulerResolver } from './resolvers/scheduler.resolver';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { DfSchedulerComponent } from './df-scheduler/df-scheduler.component';
import { getSystemServiceDataListResolver } from '../adf-services/resolvers/service-data-service.resolver';

const routes: Routes = [
  {
    path: '',
    component: DfManageSchedulerTableComponent,
    resolve: { data: schedulerResolver },
  },
  {
    path: ROUTES.CREATE,
    component: DfSchedulerComponent,
    resolve: { data: getSystemServiceDataListResolver },
  },
  {
    path: `${ROUTES.EDIT}/:id`,
    component: DfSchedulerComponent,
    resolve: {
      data: getSystemServiceDataListResolver,
      schedulerObject: schedulerResolver,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DfSchedulerRoutingModule {}
