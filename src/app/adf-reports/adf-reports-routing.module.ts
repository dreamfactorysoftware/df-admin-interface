import { NgModule } from '@angular/core';
import { DfManageServiceReportComponent } from './df-manage-service-report/df-manage-service-report.component';
import { RouterModule } from '@angular/router';
import { serviceReportsResolver } from './resolvers/service-report.resolver';

const routes = [
  {
    path: '',
    component: DfManageServiceReportComponent,
    resolve: { data: serviceReportsResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfReportsRoutingModule {}
