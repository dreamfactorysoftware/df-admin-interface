import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { AdfUserManagementRoutingModule } from './adf-user-management-routing.module';
import { DFPasswordResetComponent } from './df-password-reset/df-password-reset.component';
import { DFWaitingComponent } from './df-waiting/df-waiting.component';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [DFPasswordResetComponent, DFWaitingComponent],
  imports: [
    AdfUserManagementRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class AdfUserManagementModule {}
