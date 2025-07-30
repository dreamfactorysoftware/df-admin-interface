import {
  AfterContentInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import SwaggerUI from 'swagger-ui';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';
import { FormsModule } from '@angular/forms';
import { saveRawAsFile } from 'src/app/shared/utilities/file';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import {
  SESSION_TOKEN_HEADER,
  API_KEY_HEADER,
} from 'src/app/shared/constants/http-headers';
import {
  mapCamelToSnake,
  mapSnakeToCamel,
} from 'src/app/shared/utilities/case';
import { DfThemeService } from 'src/app/shared/services/df-theme.service';
import { AsyncPipe, NgIf, NgFor, SlicePipe, NgClass } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { ApiKeysService } from '../services/api-keys.service';
import { ApiKeyInfo } from 'src/app/shared/types/api-keys';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { DfCurrentServiceService } from 'src/app/shared/services/df-current-service.service';
import {
  tap,
  switchMap,
  map,
  distinctUntilChanged,
  catchError,
} from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { Subscription, of, forkJoin } from 'rxjs';
import { DfApiQuickstartComponent } from '../df-api-quickstart/df-api-quickstart.component';
import { ApiDocJson } from 'src/app/shared/types/files';

interface ServiceResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

interface HealthCheckResult {
  endpoint: string;
  success?: boolean;
  error?: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'df-api-docs',
  templateUrl: './df-api-docs.component.html',
  styleUrls: ['./df-api-docs.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    TranslocoModule,
    FormsModule,
    AsyncPipe,
    NgIf,
    NgFor,
    SlicePipe,
    NgClass,
    FontAwesomeModule,
    MatListModule,
    MatTooltipModule,
    MatExpansionModule,
    MatCardModule,
    DfApiQuickstartComponent,
  ],
})
export class DfApiDocsComponent implements OnInit, AfterContentInit, OnDestroy {
  @ViewChild('apiDocumentation', { static: true }) apiDocElement:
    | ElementRef
    | undefined;
  @ViewChild('swaggerInjectedContentContainer')
  swaggerInjectedContentContainerRef: ElementRef | undefined;
  @ViewChild('healthBannerElement') healthBannerElementRef:
    | ElementRef
    | undefined;

  apiDocJson: ApiDocJson;
  apiKeys: ApiKeyInfo[] = [];
  selectedApiKey: string | null = null;
  faCopy = faCopy;

  private subscriptions: Subscription[] = [];
  healthStatus: 'loading' | 'healthy' | 'unhealthy' | 'warning' = 'loading';
  healthError: string | null = null;
  serviceName: string | null = null;
  showUnhealthyErrorDetails = false;
  // Mapping of service types to their corresponding endpoints, probably would be better to move to the back-end
  healthCheckEndpointsInfo: {
    [key: string]: { endpoint: string; title: string; description: string }[];
  } = {
    Database: [
      {
        endpoint: '/_schema',
        title: 'View Available Schemas',
        description:
          'This command fetches a list of schemas from your connected database',
      },
      {
        endpoint: '/_table',
        title: 'View Tables in Your Database',
        description: 'This command lists all tables in your database',
      },
    ],
    File: [
      {
        endpoint: '/',
        title: 'View Available Folders',
        description:
          'This command fetches a list of folders from your connected file storage',
      },
    ],
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userDataService: DfUserDataService,
    private themeService: DfThemeService,
    private apiKeysService: ApiKeysService,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private currentServiceService: DfCurrentServiceService,
    private http: HttpClient
  ) {}
  isDarkMode = this.themeService.darkMode$;
  ngOnInit(): void {
    // Get the service name from the route
    this.serviceName = this.activatedRoute.snapshot.params['name'];

    // First fetch the service ID by name
    if (this.serviceName) {
      this.subscriptions.push(
        this.http
          .get<ServiceResponse>(
            `${BASE_URL}/system/service?filter=name=${this.serviceName}`
          )
          .pipe(
            map(response => response?.resource?.[0]?.id || -1),
            tap(id => {
              if (id !== -1) {
                this.currentServiceService.setCurrentServiceId(id);
              }
            })
          )
          .subscribe()
      );
    }

    // Handle the API documentation
    this.subscriptions.push(
      this.activatedRoute.data.subscribe(({ data }) => {
        if (data) {
          if (data.paths['/']?.get?.operationId === 'getSoapResources') {
            this.apiDocJson = { ...data, paths: mapSnakeToCamel(data.paths) };
          } else {
            this.apiDocJson = { ...data, paths: mapCamelToSnake(data.paths) };
          }
        }
      })
    );

    // Subscribe to the current service ID once
    this.subscriptions.push(
      this.currentServiceService
        .getCurrentServiceId()
        .pipe(
          distinctUntilChanged(),
          switchMap(serviceId =>
            this.apiKeysService.getApiKeysForService(serviceId)
          )
        )
        .subscribe(keys => {
          this.apiKeys = keys;
        })
    );
  }

  ngAfterContentInit(): void {
    this.checkApiHealth();
    this.generateSwaggerWithApiKey(this.apiDocJson);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkApiHealth(): void {
    let endpointsInfoToValidate =
      this.healthCheckEndpointsInfo[this.apiDocJson.info.group];
    if (this.serviceName && endpointsInfoToValidate) {
      // Perform health check
      this.performHealthCheck(endpointsInfoToValidate[0].endpoint);
    } else {
      this.setHealthState('warning');
    }
  }

  private setHealthState(
    status: 'healthy' | 'unhealthy' | 'warning',
    error: string | null = null
  ): void {
    this.healthStatus = status;
    this.healthError = error;
  }

  private performHealthCheck(endpoint: string): void {
    this.healthStatus = 'loading';
    this.healthError = null;

    this.subscriptions.push(
      this.http
        .get(`${BASE_URL}/${this.serviceName}${endpoint}`, {
          responseType: 'text',
        })
        .pipe(
          tap(() => this.setHealthState('healthy')),
          catchError((error: HttpErrorResponse) => {
            this.setHealthState(
              'unhealthy',
              `${endpoint}: ${
                error.message || error.error.message || 'Unknown error'
              }`
            );

            return of(null);
          })
        )
        .subscribe()
    );
  }

  goBackToList(): void {
    this.currentServiceService.clearCurrentServiceId();
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  downloadApiDoc() {
    saveRawAsFile(
      JSON.stringify(this.apiDocJson, undefined, 2),
      'api-spec.json',
      'json'
    );
  }

  copyApiKey(key: string) {
    this.clipboard.copy(key);
    this.snackBar.open('API Key copied to clipboard!', 'Close', {
      duration: 2000,
    });
  }

  toggleUnhealthyErrorDetails(): void {
    this.showUnhealthyErrorDetails = !this.showUnhealthyErrorDetails;
  }

  onApiKeySelectionChange(selectedKey: string | null): void {
    this.selectedApiKey = selectedKey;
    // Regenerate Swagger documentation with the new API key (or null for session token)
    this.generateSwaggerWithApiKey(this.apiDocJson);
  }

  private generateSwaggerWithApiKey(apiDocumentation: ApiDocJson): void {
    SwaggerUI({
      spec: apiDocumentation,
      domNode: this.apiDocElement?.nativeElement,
      requestInterceptor: (req: SwaggerUI.Request) => {
        if (this.selectedApiKey == null) {
          req['headers'][SESSION_TOKEN_HEADER] = this.userDataService.token;
        }
        // Use selected API key if available, otherwise fall back to environment key
        const apiKey = this.selectedApiKey || environment.dfApiDocsApiKey;
        req['headers'][API_KEY_HEADER] = apiKey;
        // Parse the request URL
        const url = new URL(req['url']);
        const params = new URLSearchParams(url.search);
        // Decode all parameters
        params.forEach((value, key) => {
          params.set(key, decodeURIComponent(value));
        });
        // Update the URL with decoded parameters
        url.search = params.toString();
        req['url'] = url.toString();
        return req;
      },
      showMutatedRequest: true,
      onComplete: () => {
        if (
          this.apiDocElement &&
          this.apiDocElement.nativeElement &&
          this.swaggerInjectedContentContainerRef &&
          this.swaggerInjectedContentContainerRef.nativeElement
        ) {
          const swaggerContainer = this.apiDocElement.nativeElement;
          const customContentNode =
            this.swaggerInjectedContentContainerRef.nativeElement;

          const infoContainer = swaggerContainer.querySelector(
            '.information-container .main'
          );

          this.injectCustomContent(
            swaggerContainer,
            infoContainer,
            customContentNode
          );
        }
      },
    });
  }

  private injectCustomContent(
    swaggerContainer: HTMLElement,
    infoContainer: HTMLElement | null,
    customContentNode: HTMLElement
  ): void {
    if (infoContainer) {
      infoContainer.appendChild(customContentNode);
    } else {
      if (swaggerContainer.firstChild) {
        swaggerContainer.insertBefore(
          customContentNode,
          swaggerContainer.firstChild
        );
      } else {
        swaggerContainer.appendChild(customContentNode);
      }
    }
  }
}
