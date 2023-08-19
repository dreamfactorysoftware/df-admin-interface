import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfManageRolesComponent } from './df-manage-roles/df-manage-roles.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { AdfRolesRoutingModule } from './adf-roles-routing.module';
import { DfRoleService } from './services/df-role.service';
import { DfCreateRoleComponent } from './df-create-role/df-create-role.component';

@NgModule({
  declarations: [DfManageRolesComponent, DfCreateRoleComponent],
  imports: [
    CommonModule,
    MatPaginatorModule,
    TranslateModule,
    FontAwesomeModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    AdfRolesRoutingModule,
  ],
  providers: [DfRoleService],
})
export class AdfRolesModule {}
