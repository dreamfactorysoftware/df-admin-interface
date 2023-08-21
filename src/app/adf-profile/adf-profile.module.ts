import { NgModule } from '@angular/core';
import { DfProfileComponent } from './df-profile/df-profile.component';
import { AdfProfileRoutingModule } from './adf-profile-routing.module';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DfAlertComponent } from '../shared/components/df-alert/df-alert.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { DfProfileDetailsComponent } from '../shared/components/df-profile-details/df-profile-details.component';
import { DfProfileService } from './services/df-profile.service';
import { DfPasswordService } from '../adf-user-management/services/df-password.service';

@NgModule({
  declarations: [DfProfileComponent],
  imports: [
    AdfProfileRoutingModule,
    MatTabsModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DfAlertComponent,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    TranslateModule,
    DfProfileDetailsComponent,
  ],
  providers: [DfProfileService, DfPasswordService],
})
export class AdfProfileModule {}
