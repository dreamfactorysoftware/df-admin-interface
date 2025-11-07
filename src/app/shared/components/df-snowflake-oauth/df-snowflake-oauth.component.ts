import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../../constants/urls';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { DfSnackbarService } from '../../services/df-snackbar.service';

interface OAuthStatus {
  configured: boolean;
  authorized: boolean;
  expires_at?: string;
  is_expired?: boolean;
  needs_refresh?: boolean;
}

interface OAuthAuthorizeResponse {
  authorizationUrl: string;
}

@Component({
  selector: 'df-snowflake-oauth',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './df-snowflake-oauth.component.html',
  styleUrls: ['./df-snowflake-oauth.component.scss'],
})
export class DfSnowflakeOAuthComponent implements OnInit, OnDestroy {
  @Input() serviceId?: number;
  @Input() serviceType!: string;
  @Input() config: any = {};
  @Output() needsSave = new EventEmitter<void>();

  oauthStatus: OAuthStatus | null = null;
  loading = false;
  authorizing = false;
  private destroy$ = new Subject<void>();
  private authWindow: Window | null = null;

  constructor(
    private http: HttpClient,
    private snackbarService: DfSnackbarService
  ) {}

  ngOnInit(): void {
    // Only show for Snowflake services with OAuth authenticator
    if (this.isSnowflakeOAuth) {
      this.checkStatus();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authWindow && !this.authWindow.closed) {
      this.authWindow.close();
    }
  }

  get isSnowflakeOAuth(): boolean {
    return (
      (this.serviceType === 'snowflake_db' ||
        this.serviceType === 'snowflake') &&
      this.config?.authenticator === 'oauth'
    );
  }

  get showOAuthPanel(): boolean {
    return this.isSnowflakeOAuth && this.oauthStatus !== null;
  }

  checkStatus(): void {
    if (!this.serviceId) {
      return;
    }

    this.loading = true;
    this.http
      .get<OAuthStatus>(`${BASE_URL}/_oauth/snowflake/status`, {
        params: { service_id: this.serviceId.toString() },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: status => {
          this.oauthStatus = status;
          this.loading = false;
        },
        error: error => {
          console.error('Failed to check OAuth status:', error);
          this.loading = false;
          // Don't show error if service doesn't exist yet (creating new service)
          if (error.status !== 404) {
            this.snackbarService.openSnackBar(
              'Failed to check OAuth status',
              'error'
            );
          }
        },
      });
  }

  authorize(): void {
    if (!this.serviceId) {
      // Emit event to parent component to save and authorize
      this.needsSave.emit();
      return;
    }

    this.authorizing = true;
    this.http
      .get<OAuthAuthorizeResponse>(`${BASE_URL}/_oauth/snowflake/authorize`, {
        params: { service_id: this.serviceId.toString() },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          console.log('OAuth authorize response:', response);
          if (response.authorizationUrl) {
            console.log(
              'Opening popup window with URL:',
              response.authorizationUrl
            );

            // Open authorization URL in popup
            this.authWindow = window.open(
              response.authorizationUrl,
              'SnowflakeOAuth',
              'width=600,height=700,scrollbars=yes'
            );

            console.log('window.open() returned:', this.authWindow);

            // Check if popup was blocked
            if (
              !this.authWindow ||
              this.authWindow.closed ||
              typeof this.authWindow.closed === 'undefined'
            ) {
              console.error('Popup was blocked');
              this.snackbarService.openSnackBar(
                'Popup blocked. Please allow popups for this site and try again.',
                'error'
              );
              this.authorizing = false;
              return;
            }

            console.log('Popup opened successfully, starting polling');
            // Poll for authorization completion
            this.pollForCompletion();
          }
        },
        error: error => {
          console.error('Failed to get authorization URL:', error);
          this.authorizing = false;
          const errorMsg =
            error.error?.error?.message ||
            error.error?.error ||
            'Failed to start OAuth authorization';
          this.snackbarService.openSnackBar(errorMsg, 'error');
        },
      });
  }

  private pollForCompletion(): void {
    if (!this.serviceId) {
      return;
    }

    const serviceId = this.serviceId;
    const pollInterval$ = interval(2000).pipe(
      takeUntil(this.destroy$),
      switchMap(() =>
        this.http.get<OAuthStatus>(`${BASE_URL}/_oauth/snowflake/status`, {
          params: { service_id: serviceId.toString() },
        })
      )
    );

    pollInterval$.subscribe({
      next: status => {
        this.oauthStatus = status;

        if (status.authorized) {
          // Authorization complete
          this.authorizing = false;
          if (this.authWindow && !this.authWindow.closed) {
            this.authWindow.close();
          }
          this.snackbarService.openSnackBar(
            'Successfully authorized with Snowflake!',
            'success'
          );
          this.destroy$.next(); // Stop polling
        }
      },
      error: error => {
        console.error('Polling error:', error);
        // Continue polling on error
      },
    });

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (this.authorizing) {
        this.authorizing = false;
        this.snackbarService.openSnackBar(
          'Authorization timed out. Please try again.',
          'error'
        );
        this.destroy$.next();
      }
    }, 300000);
  }

  refresh(): void {
    if (!this.serviceId) {
      return;
    }

    this.loading = true;
    this.http
      .post(`${BASE_URL}/_oauth/snowflake/refresh`, null, {
        params: { service_id: this.serviceId.toString() },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackbarService.openSnackBar(
            'OAuth token refreshed successfully',
            'success'
          );
          this.checkStatus();
        },
        error: error => {
          console.error('Failed to refresh token:', error);
          this.loading = false;
          const errorMsg =
            error.error?.error?.message ||
            error.error?.error ||
            'Failed to refresh OAuth token';
          this.snackbarService.openSnackBar(errorMsg, 'error');
        },
      });
  }
}
