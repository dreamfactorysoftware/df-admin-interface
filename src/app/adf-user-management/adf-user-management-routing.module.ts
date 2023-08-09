import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DFPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { ROUTES } from '../core/constants/routes';

const routes: Routes = [
  { path: ROUTES.PASSWORD_RESET, component: DFPasswordResetComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUserManagementRoutingModule {}
