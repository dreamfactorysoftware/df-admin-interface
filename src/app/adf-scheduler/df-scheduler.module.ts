import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { DfManageSchedulerTableComponent } from './df-manage-scheduler/df-manage-scheduler-table.component';
import { DfSchedulerRoutingModule } from './df-scheduler-routing.module';
import { HttpClient } from '@angular/common/http';
import {
  URL_TOKEN,
  DF_SCHEDULER_SERVICE_TOKEN,
} from '../core/constants/tokens';
import { URLS } from '../core/constants/urls';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';
import { DfSchedulerComponent } from './df-scheduler/df-scheduler.component';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { DfServiceDataService } from '../adf-services/services/service-data.service';
import { DfAccessListService } from './services/access-list.service';

@NgModule({
  declarations: [DfManageSchedulerTableComponent, DfSchedulerComponent],
  imports: [
    AdfManageTableModule,
    CommonModule,
    DfSchedulerRoutingModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    DfServiceDataService,
    DfAccessListService,
    { provide: URL_TOKEN, useValue: URLS.SCHEDULER },
    {
      provide: DF_SCHEDULER_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [URL_TOKEN, HttpClient],
    },
  ],
})
export class DfSchedulerModule {}
