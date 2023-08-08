import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfServiceComponent } from './df-service/df-service.component';
import { DfServiceDetailsComponent } from './df-service-details/df-service-details.component';
import { DfServiceInfoComponent } from './df-service-info/df-service-info.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DfServiceComponent,
    DfServiceDetailsComponent,
    DfServiceInfoComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule],
})
export class DfServiceModule {}
