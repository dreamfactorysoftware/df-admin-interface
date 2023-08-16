import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdfAppsRoutingModule } from './adf-apps-routing.module';
import { DfManageAppsComponent } from './df-manage-apps/df-manage-apps.component';
import { DfAppsFormComponent } from './df-apps-form/df-apps-form.component';
import { DfImportAppComponent } from './df-import-app/df-import-app.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DfAppsService } from './services/df-apps.service';
import { DfAlertComponent } from '../shared/components/df-alert/df-alert.component';

@NgModule({
  declarations: [
    DfManageAppsComponent,
    DfAppsFormComponent,
    DfImportAppComponent,
  ],
  imports: [
    CommonModule,
    DfAlertComponent,
    AdfAppsRoutingModule,
    FontAwesomeModule,
    TranslateModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [DfAppsService],
})
export class AdfAppsModule {}
