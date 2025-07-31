import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlay, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { DfCurrentServiceService } from 'src/app/shared/services/df-current-service.service';
import { ApiKeysService } from '../../../adf-api-docs/services/api-keys.service';
import { ApiKeyInfo } from 'src/app/shared/types/api-keys';
import { ApiDocJson } from 'src/app/shared/types/files';
import { BASE_URL } from 'src/app/shared/constants/urls';
import {
  SESSION_TOKEN_HEADER,
  API_KEY_HEADER,
} from 'src/app/shared/constants/http-headers';

interface TestEndpoint {
  endpoint: string;
  method: string;
  title: string;
  description: string;
  operationId?: string;
}

interface TestResult {
  success: boolean;
  status: number;
  error?: string;
}

@Component({
  selector: 'df-api-tester',
  templateUrl: './df-api-tester.component.html',
  styleUrls: ['./df-api-tester.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatIconModule,
    FormsModule,
    FontAwesomeModule,
  ],
})
export class DfApiTesterComponent implements OnChanges {
  @Input() apiDocJson: ApiDocJson;
  @Input() serviceName: string;

  // Icons
  faPlay = faPlay;
  faCheck = faCheck;
  faTimes = faTimes;

  // API Testing properties
  availableEndpoints: TestEndpoint[] = [];
  selectedEndpointIndex: number = 0;
  selectedApiKey: string | null = null;
  availableApiKeys: ApiKeyInfo[] = [];
  testResult: TestResult | null = null;
  isTesting = false;

  constructor(
    private http: HttpClient,
    private userDataService: DfUserDataService,
    private snackBar: MatSnackBar,
    private apiKeysService: ApiKeysService,
    private currentServiceService: DfCurrentServiceService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['apiDocJson'] || changes['serviceName']) &&
      this.apiDocJson &&
      this.serviceName
    ) {
      this.prepareTestEndpoints();
      this.loadApiKeys();
    }
  }

  private prepareTestEndpoints(): void {
    this.availableEndpoints = [];
    if (!this.serviceName || !this.apiDocJson?.paths) {
      return;
    }

    // Extract endpoints from apiDocJson.paths
    Object.keys(this.apiDocJson.paths).forEach(path => {
      const pathData = this.apiDocJson.paths[path];

      // Get available HTTP methods for this path
      const methods = ['get', 'post', 'put', 'patch', 'delete'].filter(
        method => pathData[method] && typeof pathData[method] === 'object'
      );

      methods.forEach(method => {
        const operation = pathData[method];
        if (operation && operation.summary) {
          this.availableEndpoints.push({
            endpoint: path,
            method: method.toUpperCase(),
            title: operation.summary,
            description: operation.description || operation.summary,
            operationId: operation.operationId,
          });
        }
      });
    });

    // Sort endpoints by path and method for better organization
    this.availableEndpoints.sort((a, b) => {
      if (a.endpoint !== b.endpoint) {
        return a.endpoint.localeCompare(b.endpoint);
      }
      return a.method.localeCompare(b.method);
    });

    // Select first endpoint by default
    if (this.availableEndpoints.length > 0) {
      this.selectedEndpointIndex = 0;
    }
  }

  private loadApiKeys(): void {
    // Get API keys from the current service
    this.currentServiceService.getCurrentServiceId().subscribe({
      next: (serviceId: number) => {
        this.apiKeysService.getApiKeysForService(serviceId).subscribe({
          next: (keys: ApiKeyInfo[]) => {
            this.availableApiKeys = keys;
          },
          error: (error: any) => {
            console.error('Failed to load API keys:', error);
            this.availableApiKeys = [];
          },
        });
      },
      error: (error: any) => {
        console.error('Failed to get service ID:', error);
        this.availableApiKeys = [];
      },
    });
  }

  testEndpoint(): void {
    const selectedEndpoint = this.getSelectedEndpoint();
    if (!selectedEndpoint || !this.serviceName) {
      this.snackBar.open('Please select an endpoint to test', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isTesting = true;
    this.testResult = null;

    const baseUrl = `${window.location.origin}${BASE_URL}/${this.serviceName}${selectedEndpoint.endpoint}`;

    let headers = new HttpHeaders({
      accept: 'application/json',
      'content-type': 'application/json',
    });

    if (this.selectedApiKey && this.selectedApiKey.trim()) {
      // Use API key authentication
      headers = headers.set(API_KEY_HEADER, this.selectedApiKey);
    } else {
      // Use session token authentication
      const sessionToken = this.userDataService.token;
      if (sessionToken) {
        headers = headers.set(SESSION_TOKEN_HEADER, sessionToken);
      }
    }

    // Prepare request options
    const requestOptions = {
      headers,
      observe: 'response' as const,
    };

    // Execute request based on selected endpoint's method
    let request;
    switch (selectedEndpoint.method.toLowerCase()) {
      case 'get':
        request = this.http.get(baseUrl, requestOptions);
        break;
      case 'post':
        request = this.http.post(baseUrl, {}, requestOptions);
        break;
      case 'put':
        request = this.http.put(baseUrl, {}, requestOptions);
        break;
      case 'patch':
        request = this.http.patch(baseUrl, {}, requestOptions);
        break;
      case 'delete':
        request = this.http.delete(baseUrl, requestOptions);
        break;
      default:
        this.snackBar.open('Unsupported HTTP method', 'Close', {
          duration: 3000,
        });
        this.isTesting = false;
        return;
    }

    request.subscribe({
      next: response => {
        this.testResult = {
          success: true,
          status: response.status,
        };
        this.isTesting = false;
        this.snackBar.open(
          `✅ Authentication successful! Access granted to ${selectedEndpoint.method} ${selectedEndpoint.endpoint}`,
          'Close',
          {
            duration: 4000,
          }
        );
      },
      error: error => {
        const isAuthError = error.status === 401 || error.status === 403;
        this.testResult = {
          success: false,
          status: error.status || 0,
          error: isAuthError
            ? 'Authentication failed - Access denied'
            : error.error?.error?.message || error.message || 'Request failed due to non-authentication error',
        };
        this.isTesting = false;

        if (isAuthError) {
          this.snackBar.open(
            '🔒 Authentication failed! Your credentials do not have access to this endpoint.',
            'Close',
            {
              duration: 5000,
            }
          );
        } else {
          this.snackBar.open(
            `✅ Authentication successful, but request failed due to other reasons (Status: ${error.status}).`,
            'Close',
            {
              duration: 4000,
            }
          );
        }
      },
    });
  }

  clearTestResult(): void {
    this.testResult = null;
  }

  getSelectedEndpoint(): TestEndpoint | null {
    return this.availableEndpoints[this.selectedEndpointIndex] || null;
  }

  getAuthenticationMethod(): string {
    return this.selectedApiKey ? 'API Key' : 'Session Token';
  }

  onEndpointChange(): void {
    // Clear previous test results when endpoint changes
    this.testResult = null;
  }

  getMethodColor(method: string): string {
    switch (method.toLowerCase()) {
      case 'get':
        return '#61affe';
      case 'post':
        return '#49cc90';
      case 'put':
        return '#fca130';
      case 'patch':
        return '#50e3c2';
      case 'delete':
        return '#f93e3e';
      default:
        return '#9b9b9b';
    }
  }

  isAuthenticationError(): boolean {
    return this.testResult?.status === 401 || this.testResult?.status === 403;
  }

  getResultIconColor(): string {
    if (this.testResult?.success) {
      return '#4caf50'; // Green for success
    } else if (this.isAuthenticationError()) {
      return '#f44336'; // Red for auth failure
    } else {
      return '#ff9800'; // Orange for non-auth failure (auth passed but request failed)
    }
  }
}
