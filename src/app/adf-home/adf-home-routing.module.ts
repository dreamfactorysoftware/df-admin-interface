import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '../core/constants/routes';
import { DfWelcomePageComponent } from './df-welcome-page/df-welcome-page.component';
import { DfResourcesPageComponent } from './df-resources-page/df-resources-page.component';
import { DfDownloadPageComponent } from './df-download-page/df-download-page.component';
import { DfQuickstartPageComponent } from './df-quickstart-page/df-quickstart-page.component';

const routes: Routes = [
  { path: '', redirectTo: ROUTES.WELCOME, pathMatch: 'full' },
  {
    path: ROUTES.WELCOME,
    component: DfWelcomePageComponent,
  },
  {
    path: ROUTES.QUICKSTART,
    component: DfQuickstartPageComponent,
  },
  { path: ROUTES.RESOURCES, component: DfResourcesPageComponent },
  {
    path: ROUTES.DOWNLOAD,
    component: DfDownloadPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfHomeRoutingModule {}
