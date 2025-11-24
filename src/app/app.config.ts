import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslocoRootModule } from './transloco-root.module';
import { DfPaywallService } from './shared/services/df-paywall.service';
import { DF_PAYWALL_SERVICE_TOKEN } from './shared/constants/tokens';
import { snowflakeUsageInterceptor } from './shared/interceptors/snowflake-usage.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([snowflakeUsageInterceptor])),
    importProvidersFrom(TranslocoRootModule),
    {
      provide: DF_PAYWALL_SERVICE_TOKEN,
      useClass: DfPaywallService,
    },
  ],
};
