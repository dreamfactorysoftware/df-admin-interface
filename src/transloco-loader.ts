import { inject, Injectable, isDevMode } from '@angular/core';
import { Translation, TranslocoLoader } from '@ngneat/transloco';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    // For development, use relative path
    // For production, use the full path
    const basePath = isDevMode() ? '' : '/dreamfactory/dist';
    return this.http.get<Translation>(`${basePath}/assets/i18n/${lang}.json`);
  }
}
