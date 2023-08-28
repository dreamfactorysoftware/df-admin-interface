import { NgModule } from '@angular/core';
import { DfManageSchedulerTableComponent } from './df-manage-scheduler/df-manage-scheduler-table.component';
import { schedulerResolver } from './resolvers/scheduler.resolver';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: DfManageSchedulerTableComponent,
    resolve: { data: schedulerResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DfSchedulerRoutingModule {}
