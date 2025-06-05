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

interface ServiceResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

interface ApiDocJson {
  info: {
    description: string | undefined;
    title: string;
    version: string | undefined;
    group: string;
  };
  paths: {
    [key: string]: any;
  };
  [key: string]: any;
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
    AsyncPipe,
    NgIf,
    NgFor,
    SlicePipe,
    NgClass,
    FontAwesomeModule,
  ],
})
export class DfApiDocsComponent implements OnInit, AfterContentInit, OnDestroy {
  @ViewChild('apiDocumentation', { static: true }) apiDocElement:
    | ElementRef
    | undefined;
  @ViewChild('healthBannerElement') healthBannerElementRef:
    | ElementRef
    | undefined;

  apiDocJson: ApiDocJson;
  apiKeys: ApiKeyInfo[] = [];
  faCopy = faCopy;
  private subscriptions: Subscription[] = [];
  healthStatus: 'loading' | 'healthy' | 'unhealthy' | 'warning' = 'loading';
  healthError: string | null = null;
  serviceName: string | null = null;
  showUnhealthyErrorDetails = false;
  private static SUPPORTED_SERVICE_TYPE_GROUPS = ['Database', 'File'];

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
    const apiDocumentation = this.apiDocJson;
    this.checkApiHealth();

    SwaggerUI({
      spec: apiDocumentation,
      domNode: this.apiDocElement?.nativeElement,
      requestInterceptor: (req: SwaggerUI.Request) => {
        req['headers'][SESSION_TOKEN_HEADER] = this.userDataService.token;
        req['headers'][API_KEY_HEADER] = environment.dfApiDocsApiKey;
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
          this.healthBannerElementRef &&
          this.healthBannerElementRef.nativeElement &&
          this.apiDocElement &&
          this.apiDocElement.nativeElement
        ) {
          const swaggerContainer = this.apiDocElement.nativeElement;
          const bannerNode = this.healthBannerElementRef.nativeElement;

          // Try to find the information container within Swagger UI
          const infoContainer = swaggerContainer.querySelector(
            '.information-container .main'
          );

          if (infoContainer) {
            // Prepend banner to the information container (which typically holds the title)
            if (infoContainer.firstChild) {
              infoContainer.insertBefore(bannerNode, infoContainer.firstChild);
            } else {
              infoContainer.appendChild(bannerNode);
            }
          } else {
            // Fallback: Prepend to the main swagger container if .information-container is not found
            if (swaggerContainer.firstChild) {
              swaggerContainer.insertBefore(
                bannerNode,
                swaggerContainer.firstChild
              );
            } else {
              swaggerContainer.appendChild(bannerNode);
            }
          }
        }
      },
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private checkApiHealth(): void {
    let endpointsToValidate = this.getApiEnpointsToValidate();
    if (this.serviceName && endpointsToValidate.length > 0) {
      // Perform health check
      this.performHealthCheck(endpointsToValidate);
    } else {
      this.setHealthState('warning');
    }
  }

  private getApiEnpointsToValidate(): string[] {
    const endpointsToValidate: string[] = [];

    if (!this.apiDocJson || !this.apiDocJson.info) {
      return []; // Not enough info to determine endpoints
    }

    if (
      DfApiDocsComponent.SUPPORTED_SERVICE_TYPE_GROUPS.includes(
        this.apiDocJson.info.group
      )
    ) {
      for (const path in this.apiDocJson.paths) {
        if (
          !Object.prototype.hasOwnProperty.call(this.apiDocJson.paths, path)
        ) {
          continue;
        }
        const methods = this.apiDocJson.paths[path];

        for (const method in methods) {
          if (!Object.prototype.hasOwnProperty.call(methods, method)) {
            continue;
          }
          if (method.toLowerCase() === 'get') {
            const operation = methods[method];
            const parameters: Array<{
              name: string;
              in: string;
              required?: boolean;
            }> = operation.parameters || [];

            const hasPathParameters = path.includes('{');

            const hasRequiredQueryParameters = parameters.some(
              param => param && param.in === 'query' && param.required === true
            );

            if (!hasPathParameters && !hasRequiredQueryParameters) {
              endpointsToValidate.push(path);
            }
          }
        }
      }
    }

    return endpointsToValidate;
  }

  private setHealthState(
    status: 'healthy' | 'unhealthy' | 'warning',
    error: string | null = null
  ): void {
    this.healthStatus = status;
    this.healthError = error;
  }

  private performHealthCheck(endpoints: string[]): void {
    this.healthStatus = 'loading';
    this.healthError = null;

    const healthCheckRequests = endpoints.map(endpoint =>
      this.http
        .get(`${BASE_URL}/${this.serviceName}${endpoint}`, {
          responseType: 'text',
        })
        .pipe(
          map(() => ({ endpoint, success: true }) as HealthCheckResult),
          catchError((error: HttpErrorResponse) => {
            return of({
              endpoint,
              error: error.message || error.error?.message || 'Unknown error',
            } as HealthCheckResult);
          })
        )
    );

    this.subscriptions.push(
      forkJoin(healthCheckRequests)
        .pipe(
          tap((results: HealthCheckResult[]) => {
            const errors = results.filter(result => result.error);
            if (errors.length > 0) {
              this.setHealthState(
                'unhealthy',
                errors.map(e => `${e.endpoint}: ${e.error}`).join(', \n\n')
              );
            } else {
              this.setHealthState('healthy');
            }
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
    this.snackBar.open('API Key copied to clipboard', 'Close', {
      duration: 3000,
    });
  }

  toggleUnhealthyErrorDetails(): void {
    this.showUnhealthyErrorDetails = !this.showUnhealthyErrorDetails;
  }
}
