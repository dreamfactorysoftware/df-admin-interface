import { Routes } from '@angular/router';
import { ROUTES } from '../shared/types/routes';
import { urlQueryLoginGuard } from './guards/url-query-login.guard';
import { oauthLoginGuard } from './guards/oauth-login.guard';
import { openRegisterGuard } from './guards/open-register.guard';

export const AuthRoutes: Routes = [
  { path: '', redirectTo: ROUTES.LOGIN, pathMatch: 'full' },
  {
    path: ROUTES.LOGIN,
    loadComponent: () =>
      import('./df-login/df-login.component').then(m => m.DfLoginComponent),
    canActivate: [urlQueryLoginGuard, oauthLoginGuard],
  },
  {
    path: ROUTES.REGISTER,
    loadComponent: () =>
      import('./df-register/df-register.component').then(
        m => m.DfRegisterComponent
      ),
    canActivate: [openRegisterGuard],
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    loadComponent: () =>
      import('./df-forgot-password/df-forgot-password.component').then(
        m => m.DfForgotPasswordComponent
      ),
  },
  {
    path: ROUTES.RESET_PASSWORD,
    loadComponent: () =>
      import('./df-password-reset/df-password-reset.component').then(
        m => m.DfPasswordResetComponent
      ),
    data: { type: 'reset' },
  },
  {
    path: ROUTES.USER_INVITE,
    loadComponent: () =>
      import('./df-password-reset/df-password-reset.component').then(
        m => m.DfPasswordResetComponent
      ),
    data: { type: 'invite' },
  },
  {
    path: ROUTES.REGISTER_CONFIRM,
    loadComponent: () =>
      import('./df-password-reset/df-password-reset.component').then(
        m => m.DfPasswordResetComponent
      ),
    data: { type: 'register' },
  },
];
