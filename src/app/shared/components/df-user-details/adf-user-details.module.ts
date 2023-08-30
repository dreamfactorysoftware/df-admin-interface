import { NgModule } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DfProfileDetailsComponent } from '../df-profile-details/df-profile-details.component';
import { DfAlertComponent } from '../df-alert/df-alert.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DfLookupKeysComponent } from '../df-lookup-keys/df-lookup-keys.component';
import { DfUserAppRolesComponent } from '../df-user-app-roles/df-user-app-roles.component';

const shared = [
  DfProfileDetailsComponent,
  DfAlertComponent,
  DfLookupKeysComponent,
  DfUserAppRolesComponent,
];

@NgModule({
  imports: shared,
  exports: [
    ...shared,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    MatRadioModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
  ],
})
export class AdfUserDetailsModule {}
