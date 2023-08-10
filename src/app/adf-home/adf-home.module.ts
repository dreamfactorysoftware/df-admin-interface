import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DfWelcomePageComponent } from './df-welcome-page/df-welcome-page.component';
import { DfResourcesPageComponent } from './df-resources-page/df-resources-page.component';
import { DfDownloadPageComponent } from './df-download-page/df-download-page.component';
import { DfQuickstartPageComponent } from './df-quickstart-page/df-quickstart-page.component';
import { MatDividerModule } from '@angular/material/divider';
import { DfIconCardLinkComponent } from './df-icon-card-link/df-icon-card-link.component';
import { DfIconLinkComponent } from './df-icon-link/df-icon-link.component';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { AdfHomeRoutingModule } from './adf-home-routing.module';

@NgModule({
  declarations: [
    DfWelcomePageComponent,
    DfResourcesPageComponent,
    DfDownloadPageComponent,
    DfQuickstartPageComponent,
    DfIconCardLinkComponent,
    DfIconLinkComponent,
  ],
  imports: [
    CommonModule,
    MatDividerModule,
    MatCardModule,
    FontAwesomeModule,
    TranslateModule,
    AdfHomeRoutingModule,
  ],
  exports: [
    DfWelcomePageComponent,
    DfResourcesPageComponent,
    DfDownloadPageComponent,
    DfQuickstartPageComponent,
  ],
})
export class AdfHomeModule {}
