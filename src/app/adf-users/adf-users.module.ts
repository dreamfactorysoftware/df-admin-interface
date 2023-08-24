import { NgModule } from '@angular/core';

import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { AdfUserDetailsModule } from '../shared/components/df-user-details/adf-user-details.module';
import { AdfUsersRoutingModule } from './adf-users-routing.module';
import { DfRoleService } from '../adf-roles/services/df-role.service';
import { DfManageUsersComponent } from './df-manage-users/df-manage-users.component';
import { DfManageUsersTableComponent } from './df-manage-users/df-manage-users-table.component';
import { DfUserDetailsComponent } from './df-user-details/df-user-details.component';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';
import { URLS } from '../core/constants/urls';
import { HttpClient } from '@angular/common/http';
import {
  DF_USER_SERVICE_TOKEN,
  USER_MESSAGE_PREFIX_TOKEN,
  USER_RELATED_TOKEN,
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
    { provide: USER_RELATED_TOKEN, useValue: 'lookup_by_user_id' },
    { provide: USER_MESSAGE_PREFIX_TOKEN, useValue: 'users' },
    {
      provide: DF_USER_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [
        USER_URL_TOKEN,
        USER_RELATED_TOKEN,
        USER_MESSAGE_PREFIX_TOKEN,
        HttpClient,
      ],
    },
    DfRoleService,
  ],
})
export class AdfUsersModule {}
