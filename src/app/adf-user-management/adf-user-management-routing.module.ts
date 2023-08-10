import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DfPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { ROUTES } from '../core/constants/routes';
import { DfLoginComponent } from './df-login/df-login.component';
import { DfForgotPasswordComponent } from './df-forgot-password/df-forgot-password.component';

const routes: Routes = [
  { path: ROUTES.PASSWORD_RESET, component: DfPasswordResetComponent },
  { path: ROUTES.LOGIN, component: DfLoginComponent },
  { path: ROUTES.FORGOT_PASSWORD, component: DfForgotPasswordComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUserManagementRoutingModule {}
