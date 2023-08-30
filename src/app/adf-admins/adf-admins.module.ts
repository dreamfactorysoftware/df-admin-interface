import { NgModule } from '@angular/core';
import { AdfAdminsRoutingModule } from './adf-admins-routing.module';
import { DfAdminDetailsComponent } from './df-admin-details/df-admin-details.component';
import { DfManageAdminsComponent } from './df-manage-admins/df-manage-admins.component';
import { AdfManageTableModule } from '../shared/components/df-manage-table/adf-manage-table.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { AdfUserDetailsModule } from '../shared/components/df-user-details/adf-user-details.module';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';
import { URLS } from '../core/constants/urls';
import { HttpClient } from '@angular/common/http';
import { DfManageAdminsTableComponent } from './df-manage-admins/df-manage-admins-table.component';
import {
  ADMIN_URL_TOKEN,
  DF_ADMIN_SERVICE_TOKEN,
} from '../core/constants/tokens';
import { DfRoleService } from '../adf-roles/services/df-role.service';

@NgModule({
  declarations: [
    DfManageAdminsComponent,
    DfAdminDetailsComponent,
    DfManageAdminsTableComponent,
  ],
  imports: [
    AdfAdminsRoutingModule,
    AdfManageTableModule,
    MatDividerModule,
    MatTabsModule,
    AdfUserDetailsModule,
  ],
  providers: [
    { provide: ADMIN_URL_TOKEN, useValue: URLS.SYSTEM_ADMIN },
    {
      provide: DF_ADMIN_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [ADMIN_URL_TOKEN, HttpClient],
    },
    DfRoleService,
  ],
})
export class AdfAdminsModule {}
