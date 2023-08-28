import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { DfManageAppsComponent } from './df-manage-apps/df-manage-apps.component';
import { DfImportAppComponent } from './df-import-app/df-import-app.component';
import { DfAppDetailsComponent } from './df-app-details/df-app-details.component';
import { appsResolver } from './resolvers/manage-apps.resolver';
import { rolesResolver } from './resolvers/roles.resolver';
import { editAppResolver } from './resolvers/edit-app.resolver';

const routes: Routes = [
  {
    path: '',
    component: DfManageAppsComponent,
    resolve: {
      data: appsResolver,
    },
  },
  {
    path: `${ROUTES.EDIT}/:id`,
    component: DfAppDetailsComponent,
    resolve: {
      roles: rolesResolver,
      appData: editAppResolver,
    },
  },
  {
    path: ROUTES.CREATE,
    component: DfAppDetailsComponent,
    resolve: {
      roles: rolesResolver,
    },
  },
  {
    path: ROUTES.IMPORT,
    component: DfImportAppComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfAppsRoutingModule {}
