import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { serviceReportsResolver } from './resolvers/service-report.resolver';
import { DfManageServiceReportTableComponent } from './df-manage-service-report/df-manage-service-report-table.component';

const routes = [
  {
    path: '',
    component: DfManageServiceReportTableComponent,
    resolve: { data: serviceReportsResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfReportsRoutingModule {}
