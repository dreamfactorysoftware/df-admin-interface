import { NgModule } from '@angular/core';
import { DfManageAdminsComponent } from './df-manage-admins/df-manage-admins.component';
import { AdfAdminsRoutingModule } from './adf-admins-routing.module';
import { DfAdminService } from './services/df-admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { DfAdminDetailsComponent } from './df-admin-details/df-admin-details.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [DfManageAdminsComponent, DfAdminDetailsComponent],
  imports: [
    AdfAdminsRoutingModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSortModule,
    CommonModule,
    FontAwesomeModule,
    TranslateModule,
  ],
  providers: [DfAdminService],
})
export class AdfAdminsModule {}
