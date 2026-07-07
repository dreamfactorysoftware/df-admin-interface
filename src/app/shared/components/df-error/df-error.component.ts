import { Location, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfErrorService } from 'src/app/shared/services/df-error.service';
import { AppError, isAppError } from 'src/app/shared/utilities/app-error';
import { DfErrorDetailComponent } from '../df-error-detail/df-error-detail.component';
import { ROUTES } from '../../types/routes';

/**
 * Route-resolution failures only: "the page you navigated to cannot load at
 * all". Reads the error from DfErrorService or from navigation/history state
 * (so a refresh on /error re-renders the same error instead of bouncing
 * to /). In-page request failures never come here.
 */
@Component({
  selector: 'df-error',
  templateUrl: './df-error.component.html',
  styleUrls: ['./df-error.component.scss'],
  standalone: true,
  imports: [NgIf, MatButtonModule, TranslocoPipe, DfErrorDetailComponent],
})
export class DfErrorComponent implements OnInit {
  error: AppError | null = null;

  constructor(
    private errorService: DfErrorService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    const stateError = history.state?.['appError'];
    this.error =
      this.errorService.error ?? (isAppError(stateError) ? stateError : null);
  }

  goHome(): void {
    this.router.navigate([ROUTES.HOME]);
  }

  tryAgain(): void {
    const retryUrl = history.state?.['retryUrl'];
    if (typeof retryUrl === 'string' && retryUrl.startsWith('/')) {
      this.router.navigateByUrl(retryUrl);
    } else {
      this.location.back();
    }
  }
}
