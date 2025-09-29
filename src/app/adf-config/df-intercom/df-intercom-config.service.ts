import { Injectable, Inject } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { DfBaseCrudService } from '../../shared/services/df-base-crud.service';
import { LOOKUP_KEYS_SERVICE_TOKEN } from '../../shared/constants/tokens';

export interface IntercomConfig {
  intercomWidget?: boolean;
  intercomAppId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DfIntercomConfigService {
  private configSubject = new BehaviorSubject<IntercomConfig>({ intercomWidget: true });
  public config$ = this.configSubject.asObservable();
  private readonly INTERCOM_KEY = 'intercom_widget_enabled';

  constructor(
    @Inject(LOOKUP_KEYS_SERVICE_TOKEN) private lookupService: DfBaseCrudService
  ) {
    // Load config on service initialization
    this.loadConfig();
  }

  private loadConfig(): void {
    this.getConfig().subscribe(config => {
      this.configSubject.next(config);
    });
  }

  getConfig(): Observable<IntercomConfig> {
    // Get the lookup key for Intercom configuration
    return this.lookupService.getAll<any>({ filter: `name="${this.INTERCOM_KEY}"` }).pipe(
      map(response => {
        const lookupKey = response?.resource?.[0];
        const config: IntercomConfig = {
          intercomWidget: lookupKey ? lookupKey.value === 'true' : true,
          intercomAppId: 'ymvqkyiw'
        };
        this.configSubject.next(config);
        return config;
      }),
      catchError(() => {
        // If config doesn't exist or error occurs, return default
        const defaultConfig: IntercomConfig = {
          intercomWidget: true,
          intercomAppId: 'ymvqkyiw'
        };
        this.configSubject.next(defaultConfig);
        return of(defaultConfig);
      })
    );
  }

  updateConfig(config: IntercomConfig): Observable<any> {
    const value = config.intercomWidget ? 'true' : 'false';

    // First check if the key exists
    return this.lookupService.getAll<any>({ filter: `name="${this.INTERCOM_KEY}"` }).pipe(
      map(response => response?.resource?.[0]),
      catchError(() => of(null)),
      switchMap(existingKey => {
        console.log('Existing lookup key:', existingKey);
        if (existingKey) {
          // Update existing key
          console.log('Updating existing key with id:', existingKey.id, 'value:', value);
          return this.lookupService.patch(existingKey.id, { value }).pipe(
            tap(() => {
              console.log('Successfully updated lookup key');
              this.configSubject.next(config);
            })
          );
        } else {
          // Create new key - DreamFactory expects data wrapped in resource array
          const payload = {
            resource: [{
              name: this.INTERCOM_KEY,
              value,
              private: false
            }]
          };
          console.log('Creating new lookup key with payload:', payload);
          return this.lookupService.create(payload).pipe(
            tap(() => {
              console.log('Successfully created lookup key');
              this.configSubject.next(config);
            })
          );
        }
      }),
      catchError(error => {
        console.error('Failed to update Intercom config:', error);
        console.error('Error details:', error.error || error);
        throw error;
      })
    );
  }

  get currentConfig(): IntercomConfig {
    return this.configSubject.value;
  }

  get isIntercomEnabled(): boolean {
    return this.configSubject.value.intercomWidget ?? true;
  }
}