import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { DfPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DfAlertComponent } from '../shared/components/df-alert/df-alert.component';
import { AdfUserManagementRoutingModule } from './adf-user-management-routing.module';
import { DfLoginComponent } from './df-login/df-login.component';
import { MatSelectModule } from '@angular/material/select';
import { DfForgotPasswordComponent } from './df-forgot-password/df-forgot-password.component';
import { DfRegisterComponent } from './df-register/df-register.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DfProfileDetailsComponent } from '../shared/components/df-profile-details/df-profile-details.component';
import { DfPasswordService } from './services/df-password.service';

@NgModule({
  declarations: [
    DfPasswordResetComponent,
    DfLoginComponent,
    DfForgotPasswordComponent,
    DfRegisterComponent,
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    TranslateModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    DfAlertComponent,
    AdfUserManagementRoutingModule,
    MatSelectModule,
    FontAwesomeModule,
    DfProfileDetailsComponent,
  ],
  providers: [DfPasswordService],
})
export class AdfUserManagementModule {}
