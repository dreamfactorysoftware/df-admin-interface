import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { AdfUserManagementRoutingModule } from './adf-user-management-routing.module';
import { DFPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { DFWaitingComponent } from './df-waiting/df-waiting.component';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [DFPasswordResetComponent, DFWaitingComponent],
  imports: [
    AdfUserManagementRoutingModule,
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
  ],
})
export class AdfUserManagementModule {}
