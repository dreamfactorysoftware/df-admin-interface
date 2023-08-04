import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DFForgotPasswordByEmailComponent } from './df-forgot-pword-email/df-forgot-pword-email.component';
import { LoginComponent } from './login/login.component';
import { SAMLAuthProvidersComponent } from './saml-auth-providers/saml-auth-providers.component';
import { RemoteAuthProvidersComponent } from './remote-auth-providers/remote-auth-providers.component';
import { DFWaitingComponent } from './df-waiting/df-waiting.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DFForgotPasswordByEmailComponent,
    LoginComponent,
    SAMLAuthProvidersComponent,
    RemoteAuthProvidersComponent,
    DFWaitingComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [LoginComponent],
})
export class UserManagementModule {}
