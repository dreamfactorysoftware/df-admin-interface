import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfServiceComponent } from './df-service/df-service.component';
import { DfServiceConfigComponent } from './df-service-details/df-service-config.component';
import { DfServiceInfoComponent } from './df-service-info/df-service-info.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DfServiceTableComponent } from './df-service-table/df-service-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DfServiceFormComponent } from './df-service-form/df-service-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';

// TODO: add translation to all components in this module

@NgModule({
  declarations: [
    DfServiceComponent,
    DfServiceConfigComponent,
    DfServiceInfoComponent,
    DfServiceTableComponent,
    DfServiceFormComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    MatSelectModule,
    MatStepperModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  exports: [DfServiceComponent],
})
export class DfServiceModule {}
