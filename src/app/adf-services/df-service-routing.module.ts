import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { loggedInGuard } from '../core/guards/logged-in.guard';
import { DfCreateServiceComponent } from './df-create-service/df-create-service.component';
import { DfServiceComponent } from './df-service/df-service.component';
import {
  getServiceTypeDataResolver,
  getSystemServiceDataListResolver,
  getSystemServiceDataResolver,
} from './resolvers/service-data-service.resolver';
import { DfEditServiceComponent } from './df-edit-service/df-edit-service.component';

const routes: Routes = [
  {
    path: ROUTES.CREATE_SERVICES,
    component: DfCreateServiceComponent,
    canActivate: [loggedInGuard],
    resolve: { data: getServiceTypeDataResolver },
  },
  {
    path: ROUTES.MANAGE_SERVICES,
    component: DfServiceComponent,
    canActivate: [loggedInGuard],
    resolve: { data: getSystemServiceDataListResolver },
  },
  {
    path: ROUTES.MANAGE_SERVICES + '/:id',
    component: DfEditServiceComponent,
    canActivate: [loggedInGuard],
    resolve: {
      systemServiceData: getSystemServiceDataResolver,
      serviceTypeData: getServiceTypeDataResolver,
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DfServiceRoutingModule {}
