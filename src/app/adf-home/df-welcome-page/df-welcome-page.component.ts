import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Add this import
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  faDatabase,
  faCode,
  faNetworkWired,
  faFile,
  faTools,
  faBook,
} from '@fortawesome/free-solid-svg-icons';

import {
  javaScriptExampleLinks,
  nativeExampleLinks,
  welcomePageResources,
} from '../../shared/constants/home';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';

import { DfIconCardLinkComponent } from '../df-icon-card-link/df-icon-card-link.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { DfIconLinkComponent } from '../df-icon-link/df-icon-link.component';
import { NgFor, AsyncPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCirclePlay,
  faComment,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfQuickstartPageComponent } from '../df-quickstart-page/df-quickstart-page.component';
import { DfResourcesPageComponent } from '../df-resources-page/df-resources-page.component';
import { DfDownloadPageComponent } from '../df-download-page/df-download-page.component';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';
import { SERVICES_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DFStorageService } from 'src/app/shared/services/df-storage.service';
import { ROUTES } from '../../shared/types/routes';
import { DfGenerateApiCardComponent } from './df-generate-api-card/df-generate-api-card.component';

@Component({
  selector: 'df-welcome-page',
  templateUrl: './df-welcome-page.component.html',
  styleUrls: ['./df-welcome-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgFor,
    DfIconLinkComponent,
    MatCardModule,
    MatDividerModule,
    DfIconCardLinkComponent,
    AsyncPipe,
    TranslocoPipe,
    DfQuickstartPageComponent,
    DfResourcesPageComponent,
    DfDownloadPageComponent,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    DfGenerateApiCardComponent,
  ],
  providers: [DfBaseCrudService],
})
export class DfWelcomePageComponent {
  faCirclePlay = faCirclePlay;
  faHeart = faHeart;
  faComment = faComment;
  faDatabase = faDatabase;
  faCode = faCode;
  faNetworkWired = faNetworkWired;
  faFile = faFile;
  faTools = faTools;
  faBook = faBook;

  fpDBRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.DATABASE}/${ROUTES.CREATE}`;
  fpScriptingRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.SCRIPTING}/${ROUTES.CREATE}`;
  fpNetworkRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.NETWORK}/${ROUTES.CREATE}`;
  fpFileRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.FILE}/${ROUTES.CREATE}`;
  fpUtilityRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_TYPES}/${ROUTES.UTILITY}/${ROUTES.CREATE}`;
  fpApiDocsRoute = `/${ROUTES.API_CONNECTIONS}/${ROUTES.API_DOCS}`;

  public generateApiCardsData: any[];

  welcomePageResources = welcomePageResources;
  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  constructor(
    public breakpointService: DfBreakpointService,
    private themeService: DfThemeService,
    private storageService: DFStorageService,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService
  ) {
    this.generateApiCardsData = [
      {
        icon: this.faDatabase,
        headerTextKey: 'home.welcomePage.connectToDatabaseCard.header',
        textKey: 'home.welcomePage.connectToDatabaseCard.description',
        route: this.fpDBRoute,
        bgColor: 'rgba(127, 17, 224, 0.1)',
        headerColor: 'rgb(127, 17, 224)',
      },
      {
        icon: this.faCode,
        headerTextKey: 'home.welcomePage.useScriptingServicesCard.header',
        textKey: 'home.welcomePage.useScriptingServicesCard.description',
        route: this.fpScriptingRoute,
        bgColor: 'rgba(92,35,154, 0.1)',
        headerColor: 'rgb(92,35,154)',
      },
      {
        icon: this.faNetworkWired,
        headerTextKey: 'home.welcomePage.proxyWebServicesCard.header',
        textKey: 'home.welcomePage.proxyWebServicesCard.description',
        route: this.fpNetworkRoute,
        bgColor: 'rgb(235,253,245)',
        headerColor: 'rgb(25,97,80)',
      },
      {
        icon: this.faFile,
        headerTextKey: 'home.welcomePage.exposeFileStorageCard.header',
        textKey: 'home.welcomePage.exposeFileStorageCard.description',
        route: this.fpFileRoute,
        bgColor: 'rgb(255,251,236)',
        headerColor: 'rgb(136,72,43)',
      },
      {
        icon: this.faTools,
        headerTextKey: 'home.welcomePage.utilityServicesCard.header',
        textKey: 'home.welcomePage.utilityServicesCard.description',
        route: this.fpUtilityRoute,
        bgColor: 'rgba(80,105,137, 0.1)',
        headerColor: 'rgb(80,105,137)',
      },
      {
        icon: this.faBook,
        headerTextKey: 'home.welcomePage.apiDocsCard.header',
        textKey: 'home.welcomePage.apiDocsCard.description',
        route: this.fpApiDocsRoute,
        bgColor: 'rgba(217, 54, 138, 0.1)',
        headerColor: 'rgb(217, 54, 138)',
      },
    ];
  }
  isDarkMode = this.themeService.darkMode$;
  isFirstTimeUser$ = this.storageService.isFirstTimeUser$;
  releases: any[] = [];

  ngOnInit(): void {
    this.servicesService.getReleases().subscribe((data: any) => {
      this.releases = data.slice(0, 3);
    });
    this.storageService.setIsFirstUser();
  }

  convertDateType(originalDate: string): string {
    const dateObject = new Date(originalDate);
    const formattedDate = dateObject.toISOString().split('T')[0];
    return formattedDate;
  }
}
