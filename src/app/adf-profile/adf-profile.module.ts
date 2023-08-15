import { NgModule } from '@angular/core';
import { DfProfileComponent } from './df-profile/df-profile.component';
import { AdfProfileRoutingModule } from './adf-profile-routing.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DfAlertComponent } from '../shared/components/df-alert/df-alert.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { DfUserDetailsComponent } from '../shared/components/df-user-details/df-user-details.component';

@NgModule({
  declarations: [DfProfileComponent],
  imports: [
    AdfProfileRoutingModule,
    MatCheckboxModule,
    MatTabsModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DfAlertComponent,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    TranslateModule,
    DfUserDetailsComponent,
  ],
})
export class AdfProfileModule {}
