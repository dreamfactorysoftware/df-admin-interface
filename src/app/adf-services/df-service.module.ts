import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfServiceComponent } from './df-service/df-service.component';
import { DfServiceDetailsComponent } from './df-service-details/df-service-details.component';
import { DfServiceInfoComponent } from './df-service-info/df-service-info.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DfServiceTableComponent } from './df-service-table/df-service-table.component';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [
    DfServiceComponent,
    DfServiceDetailsComponent,
    DfServiceInfoComponent,
    DfServiceTableComponent,
  ],
  imports: [CommonModule, MatTableModule, ReactiveFormsModule],
})
export class DfServiceModule {}
