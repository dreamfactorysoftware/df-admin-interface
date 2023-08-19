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
import { DfUserDetailsComponent } from '../shared/components/df-user-details/df-user-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    DfUserDetailsComponent,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [DfAdminService],
})
export class AdfAdminsModule {}
