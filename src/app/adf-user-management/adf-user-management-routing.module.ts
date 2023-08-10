import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DfPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { ROUTES } from '../core/constants/routes';
import { DfLoginComponent } from './df-login/df-login.component';
import { DfForgotPasswordComponent } from './df-forgot-password/df-forgot-password.component';
import { urlQueryLoginGuard } from './guards/url-query-login.guard';
import { DfPlaceHolderComponent } from '../shared/components/df-placeholder/df-placeholder.component';
import { openRegisterGuard } from '../core/guards/open-register.guard';

const routes: Routes = [
  { path: '', redirectTo: ROUTES.LOGIN, pathMatch: 'full' },
  { path: ROUTES.PASSWORD_RESET, component: DfPasswordResetComponent },
  {
    path: ROUTES.LOGIN,
    component: DfLoginComponent,
    canActivate: [urlQueryLoginGuard],
  },
  { path: ROUTES.FORGOT_PASSWORD, component: DfForgotPasswordComponent },
  {
    path: ROUTES.REGISTER,
    component: DfPlaceHolderComponent,
    canActivate: [openRegisterGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdfUserManagementRoutingModule {}
