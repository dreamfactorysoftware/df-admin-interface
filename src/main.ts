import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/routes';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DfSystemConfigDataService } from './app/core/services/df-system-config-data.service';
import { APP_INITIALIZER, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { sessionTokenInterceptor } from './app/core/interceptors/session-token.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { snackbarInterceptor } from './app/core/interceptors/snackbar.interceptor';
import { caseInterceptor } from './app/core/interceptors/case.interceptor';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@ngneat/transloco';

function initEnvironment(systemConfigService: DfSystemConfigDataService) {
  return () => systemConfigService.fetchEnvironmentData();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initEnvironment,
      deps: [DfSystemConfigDataService],
      multi: true,
    },
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        sessionTokenInterceptor,
        loadingInterceptor,
        snackbarInterceptor,
        caseInterceptor,
      ])
    ),
    provideRouter(routes, withHashLocation()),
    provideTransloco({
      config: {
        availableLangs: ['en'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
}).catch(err => console.error(err));
