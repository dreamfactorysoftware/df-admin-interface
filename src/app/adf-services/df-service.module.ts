import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfServiceComponent } from './df-service/df-service.component';
import { DfServiceDefinitionComponent } from './df-service-definition/df-service-definition.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DfManageServicesComponent } from './df-manage-services/manage-services.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DfServiceFormComponent } from './df-service-form/df-service-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DfAlertComponent } from '../shared/components/df-alert/df-alert.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DfServiceLinksCardComponent } from './df-service-definition/df-service-links-card/df-service-links-card.component';
import { MatCardModule } from '@angular/material/card';
import { DfCreateServiceComponent } from './df-create-service/df-create-service.component';

@NgModule({
  declarations: [
    DfServiceComponent,
    DfServiceDefinitionComponent,
    DfManageServicesComponent,
    DfServiceFormComponent,
    DfServiceLinksCardComponent,
    DfCreateServiceComponent,
  ],
  imports: [
    CommonModule,
    DfAlertComponent,
    FontAwesomeModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    MatDialogModule,
    MatSelectModule,
    MatSnackBarModule,
    MatStepperModule,
    MatSortModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  exports: [DfServiceComponent],
})
export class DfServiceModule {}
