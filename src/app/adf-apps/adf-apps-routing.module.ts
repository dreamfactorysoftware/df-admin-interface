import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { DfManageAppsComponent } from './df-manage-apps/df-manage-apps.component';
import { DfImportAppComponent } from './df-import-app/df-import-app.component';

const routes: Routes = [
  { path: '', redirectTo: ROUTES.MANAGE, pathMatch: 'full' },
  {
    path: ROUTES.MANAGE,
    component: DfManageAppsComponent,
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
