import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { DfManageSchedulerTableComponent } from './df-manage-scheduler/df-manage-scheduler-table.component';
import { DfSchedulerRoutingModule } from './df-scheduler-routing.module';
import { HttpClient } from '@angular/common/http';
import {
  URL_TOKEN,
  RELATED_TOKEN,
  MESSAGE_PREFIX_TOKEN,
  DF_SCHEDULER_SERVICE_TOKEN,
} from '../core/constants/tokens';
import { URLS } from '../core/constants/urls';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';

@NgModule({
  declarations: [DfManageSchedulerTableComponent],
  imports: [AdfManageTableModule, CommonModule, DfSchedulerRoutingModule],
  providers: [
    { provide: URL_TOKEN, useValue: URLS.SCHEDULER },
    {
      provide: RELATED_TOKEN,
      useValue: '',
    },
    { provide: MESSAGE_PREFIX_TOKEN, useValue: 'scheduler' },
    {
      provide: DF_SCHEDULER_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [URL_TOKEN, RELATED_TOKEN, MESSAGE_PREFIX_TOKEN, HttpClient],
    },
  ],
})
export class DfSchedulerModule {}
