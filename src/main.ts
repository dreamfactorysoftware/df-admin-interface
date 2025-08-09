import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/routes';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DfSystemConfigDataService } from './app/shared/services/df-system-config-data.service';
import { DfLicenseInitializerService } from './app/shared/services/df-license-initializer.service';
import { APP_INITIALIZER, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { sessionTokenInterceptor } from './app/shared/interceptors/session-token.interceptor';
import { loadingInterceptor } from './app/shared/interceptors/loading.interceptor';
import { snackbarInterceptor } from './app/shared/interceptors/snackbar.interceptor';
import { caseInterceptor } from './app/shared/interceptors/case.interceptor';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@ngneat/transloco';
import { errorInterceptor } from './app/shared/interceptors/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SUPPORTED_LANGUAGES } from './app/shared/constants/languages';
import { detectUserLanguage } from './app/shared/utilities/language';

function initEnvironment(systemConfigService: DfSystemConfigDataService) {
  return () => systemConfigService.fetchEnvironmentData();
}

function initLicenseCheck(licenseInitializer: DfLicenseInitializerService) {
  return () => licenseInitializer.initializeLicenseCheck();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, MatSnackBarModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initEnvironment,
      deps: [DfSystemConfigDataService],
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
      withInterceptors([
        caseInterceptor,
        loadingInterceptor,
        errorInterceptor,
        sessionTokenInterceptor,
        snackbarInterceptor,
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
