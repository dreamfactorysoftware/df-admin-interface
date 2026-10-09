import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/routes';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DfSystemConfigDataService } from './app/shared/services/df-system-config-data.service';
import { DfLicenseInitializerService } from './app/shared/services/df-license-initializer.service';
import {
  APP_INITIALIZER,
  ErrorHandler,
  importProvidersFrom,
  isDevMode,
} from '@angular/core';
import { ChunkErrorHandler } from './app/shared/services/chunk-error.handler';
import { provideRouter, withHashLocation } from '@angular/router';
import { sessionTokenInterceptor } from './app/shared/interceptors/session-token.interceptor';
import { loadingInterceptor } from './app/shared/interceptors/loading.interceptor';
import { caseInterceptor } from './app/shared/interceptors/case.interceptor';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@ngneat/transloco';
import { errorInterceptor } from './app/shared/interceptors/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SUPPORTED_LANGUAGES } from './app/shared/constants/languages';
import { detectUserLanguage } from './app/shared/utilities/language';
import { DfTrialService } from './app/shared/services/df-trial.service';
import { trialLockFromError } from './app/shared/utilities/trial';
import { catchError, of, throwError } from 'rxjs';

function initEnvironment(
  systemConfigService: DfSystemConfigDataService,
  trialService: DfTrialService
) {
  return () =>
    systemConfigService.fetchEnvironmentData().pipe(
      catchError(err => {
        // A locked trial instance answers 402 TRIAL_EXPIRED / 403
        // TRIAL_TOKEN_INVALID here (design addendum 5). errorInterceptor has
        // already recorded the lock; resolve so the shell boots and shows the
        // trial-expired page instead of a blank app. Every other failure keeps
        // the historic behaviour (bootstrap rejects).
        const lock = trialLockFromError(err);
        if (lock) {
          trialService.markLocked(lock.reason, lock.context);
          return of(null);
        }
        if (trialService.isLocked) {
          return of(null);
        }
        return throwError(() => err);
      })
    );
}

function initLicenseCheck(licenseInitializer: DfLicenseInitializerService) {
  return () => licenseInitializer.initializeLicenseCheck();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, MatSnackBarModule),
    // Self-heal stale lazy chunks after a rebuild/deploy (reload once).
    { provide: ErrorHandler, useClass: ChunkErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: initEnvironment,
      deps: [DfSystemConfigDataService, DfTrialService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initLicenseCheck,
      deps: [DfLicenseInitializerService],
      multi: true,
    },
    provideAnimations(),
    provideHttpClient(
      // errorInterceptor registered last: it sees errors first on unwind, so
      // every component-level catchError downstream receives a normalized
      // AppError. Success toasts (formerly snackbarInterceptor) live in
      // errorInterceptor's success tap.
      withInterceptors([
        caseInterceptor,
        loadingInterceptor,
        sessionTokenInterceptor,
        errorInterceptor,
      ])
    ),
    provideRouter(routes, withHashLocation()),
    provideTransloco({
      config: {
        availableLangs: SUPPORTED_LANGUAGES.map(lang => lang.code),
        defaultLang: detectUserLanguage(),
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
}).catch(err => console.error(err));
