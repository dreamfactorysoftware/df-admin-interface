import { HttpClient } from '@angular/common/http';
import {
  TRANSLOCO_LOADER,
  Translation,
  TranslocoLoader,
  TRANSLOCO_CONFIG,
  translocoConfig,
  TranslocoModule,
  TRANSLOCO_TRANSPILER,
  DefaultTranspiler,
} from '@ngneat/transloco';
import { Injectable, NgModule } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

@NgModule({
  exports: [TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: environment.production,
      }),
    },
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader },
    { provide: TRANSLOCO_TRANSPILER, useClass: DefaultTranspiler },
  ],
})
export class TranslocoRootModule {}
