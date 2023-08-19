import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { DfManageAppsComponent } from './df-manage-apps/df-manage-apps.component';
import { DfImportAppComponent } from './df-import-app/df-import-app.component';
import { DfAppsFormComponent } from './df-apps-form/df-apps-form.component';
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
    path: 'edit/:id',
    component: DfAppsFormComponent,
    resolve: {
      roles: rolesResolver,
      appData: editAppResolver,
    },
  },
  {
    path: 'create',
    component: DfAppsFormComponent,
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
