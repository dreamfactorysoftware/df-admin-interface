import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdfAppsRoutingModule } from './adf-apps-routing.module';
import { DfManageAppsComponent } from './df-manage-apps/df-manage-apps.component';
import { DfCreateAppComponent } from './df-create-app/df-create-app.component';
import { DfImportAppComponent } from './df-import-app/df-import-app.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    DfManageAppsComponent,
    DfCreateAppComponent,
    DfImportAppComponent,
  ],
  imports: [
    CommonModule,
    AdfAppsRoutingModule,
    FontAwesomeModule,
    TranslateModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class AdfAppsModule {}
