import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AdfAppsRoutingModule } from './adf-apps-routing.module';
import { DfManageAppsComponent } from './df-manage-apps/df-manage-apps.component';
import { DfAppDetailsComponent } from './df-app-details/df-app-details.component';
import { DfImportAppComponent } from './df-import-app/df-import-app.component';
import { DfManageAppsTableComponent } from './df-manage-apps/df-manage-apps-table.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  APPS_URL_TOKEN,
  DF_APPS_SERVICE_TOKEN,
  DF_ROLE_SERVICE_TOKEN,
  ROLE_URL_TOKEN,
} from '../core/constants/tokens';
import { DfBaseCrudServiceFactory } from '../core/services/df-base-crud.service';
import { HttpClient } from '@angular/common/http';
import { URLS } from '../core/constants/urls';

@NgModule({
  declarations: [
    DfManageAppsComponent,
    DfManageAppsTableComponent,
    DfAppDetailsComponent,
    DfImportAppComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AdfAppsRoutingModule,
    FontAwesomeModule,
    TranslateModule,
    MatTableModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    MatRadioModule,
    MatSelectModule,
    MatCardModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  providers: [
    {
      provide: APPS_URL_TOKEN,
      useValue: URLS.APP,
    },
    {
      provide: DF_APPS_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [APPS_URL_TOKEN, HttpClient],
    },
    {
      provide: ROLE_URL_TOKEN,
      useValue: URLS.ROLES,
    },
    {
      provide: DF_ROLE_SERVICE_TOKEN,
      useFactory: DfBaseCrudServiceFactory,
      deps: [ROLE_URL_TOKEN, HttpClient],
    },
  ],
})
export class AdfAppsModule {}
