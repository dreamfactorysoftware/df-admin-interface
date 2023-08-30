import { NgModule } from '@angular/core';

import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { AdfUserDetailsModule } from '../shared/components/df-user-details/adf-user-details.module';
import { AdfUsersRoutingModule } from './adf-users-routing.module';
import { DfManageUsersComponent } from './df-manage-users/df-manage-users.component';
import { DfManageUsersTableComponent } from './df-manage-users/df-manage-users-table.component';
import { DfUserDetailsComponent } from './df-user-details/df-user-details.component';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';
import { URLS } from '../core/constants/urls';
import { HttpClient } from '@angular/common/http';
import {
  APPS_URL_TOKEN,
  DF_APPS_SERVICE_TOKEN,
  DF_ROLE_SERVICE_TOKEN,
  DF_USER_SERVICE_TOKEN,
  ROLE_URL_TOKEN,
  USER_URL_TOKEN,
} from '../core/constants/tokens';

@NgModule({
  declarations: [
    DfManageUsersComponent,
    DfManageUsersTableComponent,
    DfUserDetailsComponent,
  ],
  imports: [
    AdfUsersRoutingModule,
    AdfManageTableModule,
    MatDividerModule,
    MatTabsModule,
    AdfUserDetailsModule,
  ],
  providers: [
    { provide: USER_URL_TOKEN, useValue: URLS.SYSTEM_USER },
    {
      provide: DF_USER_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [USER_URL_TOKEN, HttpClient],
    },
    { provide: ROLE_URL_TOKEN, useValue: URLS.ROLES },
    {
      provide: DF_ROLE_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [ROLE_URL_TOKEN, HttpClient],
    },
    { provide: APPS_URL_TOKEN, useValue: URLS.APP },
    {
      provide: DF_APPS_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [APPS_URL_TOKEN, HttpClient],
    },
  ],
})
export class AdfUsersModule {}
