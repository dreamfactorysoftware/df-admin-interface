import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DfManageLimitsComponent } from './df-manage-limits/df-manage-limits.component';
import { limitsResolver } from './resolvers/limits.resolver';
import { DfLimitComponent } from './df-limit/df-limit.component';
import { ROUTES } from '../core/constants/routes';

const routes: Routes = [
  {
    path: '',
    component: DfManageLimitsComponent,
    resolve: { data: limitsResolver },
  },
  {
    path: ROUTES.CREATE,
    component: DfLimitComponent,
  },
  {
    path: `${ROUTES.EDIT}/:id`,
    component: DfLimitComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfLimitsRoutingModule {}
