import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfServiceComponent } from './df-service/df-service.component';
import { DfServiceDetailsComponent } from './df-service-details/df-service-details.component';
import { DfServiceInfoComponent } from './df-service-info/df-service-info.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DfServiceTableComponent } from './df-service-table/df-service-table.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DfServiceDialogComponent } from './df-service-dialog/df-service-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@NgModule({
  declarations: [
    DfServiceComponent,
    DfServiceDetailsComponent,
    DfServiceInfoComponent,
    DfServiceTableComponent,
    DfServiceDialogComponent,
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    ReactiveFormsModule,
  ],
  exports: [DfServiceComponent],
})
export class DfServiceModule {}
