import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CaseInterceptor } from './core/interceptors/case.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { SessionTokenInterceptor } from './core/interceptors/session-token.interceptor';
import { DfSystemConfigDataService } from './core/services/df-system-config-data.service';
import { DfSideNavComponent } from './shared/components/df-side-nav/df-side-nav.component';
import { SnackbarInterceptor } from './core/interceptors/snackbar.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DfSnackbarComponent } from './shared/components/df-snackbar/df-snackbar.component';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function initEnvironment(
  systemConfigService: DfSystemConfigDataService
) {
  return () => systemConfigService.fetchEnvironmentData();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
      defaultLanguage: 'en',
    }),
    HttpClientModule,
    MatProgressSpinnerModule,
    DfSideNavComponent,
    MatSnackBarModule,
    DfSnackbarComponent,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initEnvironment,
      deps: [DfSystemConfigDataService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CaseInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SessionTokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SnackbarInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
