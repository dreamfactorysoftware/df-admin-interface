import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DfPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { ROUTES } from '../core/constants/routes';
import { DfLoginComponent } from './df-login/df-login.component';
import { DfForgotPasswordComponent } from './df-forgot-password/df-forgot-password.component';
import { urlQueryLoginGuard } from './guards/url-query-login.guard';
import { DfPlaceHolderComponent } from '../shared/components/df-placeholder/df-placeholder.component';
import { openRegisterGuard } from './guards/open-register.guard';
import { oauthLoginGuard } from './guards/oauth-login.guard';

const routes: Routes = [
  { path: '', redirectTo: ROUTES.LOGIN, pathMatch: 'full' },
  {
    path: ROUTES.LOGIN,
    component: DfLoginComponent,
    canActivate: [urlQueryLoginGuard, oauthLoginGuard],
  },
  {
    path: ROUTES.REGISTER,
    component: DfPlaceHolderComponent,
    canActivate: [openRegisterGuard],
  },
  { path: ROUTES.FORGOT_PASSWORD, component: DfForgotPasswordComponent },
  {
    path: ROUTES.PASSWORD_RESET,
    component: DfPasswordResetComponent,
    data: { type: 'reset' },
  },
  {
    path: ROUTES.USER_INVITE,
    component: DfPasswordResetComponent,
    data: { type: 'confirm' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUserManagementRoutingModule {}
