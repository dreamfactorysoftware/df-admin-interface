import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DfPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { ROUTES } from '../core/constants/routes';
import { DfLoginComponent } from './df-login/df-login.component';
import { DfForgotPasswordComponent } from './df-forgot-password/df-forgot-password.component';
import { urlQueryLoginGuard } from './guards/url-query-login.guard';
import { openRegisterGuard } from './guards/open-register.guard';
import { oauthLoginGuard } from './guards/oauth-login.guard';
import { DfRegisterComponent } from './df-register/df-register.component';

const routes: Routes = [
  { path: '', redirectTo: ROUTES.LOGIN, pathMatch: 'full' },
  {
    path: ROUTES.LOGIN,
    component: DfLoginComponent,
    canActivate: [urlQueryLoginGuard, oauthLoginGuard],
  },
  {
    path: ROUTES.REGISTER,
    component: DfRegisterComponent,
    canActivate: [openRegisterGuard],
  },
  { path: ROUTES.FORGOT_PASSWORD, component: DfForgotPasswordComponent },
  {
    path: ROUTES.RESET_PASSWORD,
    component: DfPasswordResetComponent,
    data: { type: 'reset' },
  },
  {
    path: ROUTES.USER_INVITE,
    component: DfPasswordResetComponent,
    data: { type: 'invite' },
  },
  {
    path: ROUTES.REGISTER_CONFIRM,
    component: DfPasswordResetComponent,
    data: { type: 'register' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUserManagementRoutingModule {}
