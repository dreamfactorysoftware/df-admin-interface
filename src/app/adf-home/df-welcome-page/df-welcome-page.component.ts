import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import {
  javaScriptExampleLinks,
  nativeExampleLinks,
  welcomePageResources,
} from '../../shared/constants/home';
import { DfBreakpointService } from 'src/app/shared/services/df-breakpoint.service';
import { GenericListResponse } from 'src/app/shared/types/generic-http';
import { Service, ServiceRow, ServiceType } from 'src/app/shared/types/service';
import { forkJoin } from 'rxjs';

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
import { SERVICE_GROUPS } from 'src/app/shared/constants/serviceGroups';
import { ROUTES } from 'src/app/shared/types/routes';
import { BehaviorSubject } from 'rxjs';

interface ServiceCard {
  type: string[];
  name: string;
  num: number;
}

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
  ],
  providers: [DfBaseCrudService],
})
export class DfWelcomePageComponent {
  faCirclePlay = faCirclePlay;
  faHeart = faHeart;
  faComment = faComment;

  welcomePageResources = welcomePageResources;
  nativeExampleLinks = nativeExampleLinks;
  javaScriptExampleLinks = javaScriptExampleLinks;

  constructor(
    public breakpointService: DfBreakpointService,
    private themeService: DfThemeService,
    private storageService: DFStorageService,
    private sanitizer: DomSanitizer,
    @Inject(SERVICES_SERVICE_TOKEN) private servicesService: DfBaseCrudService
  ) {}
  serviceCards$ = new BehaviorSubject<ServiceCard[]>([]);
  apiKeyNum$ = new BehaviorSubject<number | 0>(0);
  isDarkMode = this.themeService.darkMode$;
  isFirstTimeUser$ = this.storageService.isFirstTimeUser$;
  releases: any[] = [];
  latestVideoLink$ = new BehaviorSubject<SafeResourceUrl | null>(null);
  ngOnInit(): void {
    const serviceCards: ServiceCard[] = [
      {
        type: ['Database', 'Big Data'],
        name: 'Database Connections',
        num: 0,
      },
      {
        type: ['Script'],
        name: 'Scripting',
        num: 0,
      },
      {
        type: ['Remote Service'],
        name: 'Network Connections',
        num: 0,
      },
    ];
    this.serviceCards$.next(serviceCards);
    this.servicesService.getReleases().subscribe((data: any) => {
      this.releases = data.slice(0, 3);
    });
    this.storageService.setIsFirstUser();
    serviceCards
      .filter(
        (card, index, array) =>
          array.findIndex(c => c.type === card.type) === index
      )
      .forEach(card => {
        this.getServiceNum(card.type, card.name);
      });
    this.getApiKeyNum();

    this.servicesService.getLatestVideo().subscribe((data: any) => {
      if (data.items && data.items.length > 0) {
        const link = data.items[0].link;
        const id = link.split('v=')[1];
        const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://youtube.com/embed/${id}?controls=0&showinfo=0&rel=0`
        );
        this.latestVideoLink$.next(safeUrl);
      }
    });
  }

  getServiceNum(groups: string[], name: string) {
    const requests = groups.map(grp =>
      this.servicesService.getCustomData<GenericListResponse<ServiceType>>(
        '/api/v2/system/service_type',
        {
          fields: 'name',
          additionalParams: [
            {
              key: 'group',
              value: grp,
            },
          ],
        }
      )
    );
    forkJoin(requests).subscribe(results => {
      const mergedServiceTypes = results.reduce(
        (acc, response) => [...acc, ...response.resource],
        [] as ServiceType[]
      );
      this.servicesService
        .getAll<GenericListResponse<Service>>({
          limit: 50,
          sort: 'name',
          filter: `(type in ("${mergedServiceTypes
            .map(src => src.name)
            .join('","')}"))`,
        })
        .subscribe(data => {
          const currentCards = this.serviceCards$.getValue();
          const updatedCards = currentCards.map(card =>
            card.name === name ? { ...card, num: data.resource.length } : card
          );
          this.serviceCards$.next(updatedCards);
        });
    });
  }

  getApiKeyNum() {
    this.servicesService
      .getCustomData<GenericListResponse<ServiceType>>('/api/v2/system/app', {
        sort: 'name',
        fields: '*',
        related: 'role_by_role_id',
      })
      .subscribe(data => {
        this.apiKeyNum$.next(data.resource.length);
      });
  }

  getServiceCardByName(name: string): ServiceCard | null {
    return (
      this.serviceCards$.getValue().find(card => card.name === name) || null
    );
  }

  convertDateType(originalDate: string): string {
    const dateObject = new Date(originalDate);
    const formattedDate = dateObject.toISOString().split('T')[0];
    return formattedDate;
  }
}
