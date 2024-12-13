import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoRootModule } from './transloco-root.module';
import { DfPaywallService } from './shared/services/df-paywall.service';
import { DF_PAYWALL_SERVICE_TOKEN } from './shared/constants/tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(TranslocoRootModule),
    {
      provide: DF_PAYWALL_SERVICE_TOKEN,
      useClass: DfPaywallService
    }
  ]
}; 