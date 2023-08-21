import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DfManageLimitsComponent } from './df-manage-limits/df-manage-limits.component';
import { limitsResolver } from './resolvers/limits.resolver';

const routes: Routes = [
  {
    path: '',
    component: DfManageLimitsComponent,
    resolve: { data: limitsResolver },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfLimitsRoutingModule {}
