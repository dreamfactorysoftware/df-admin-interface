import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer, forkJoin } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';

export interface DashboardStats {
  services: {
    total: number;
  };
  apiKeys: {
    total: number;
  };
  roles: {
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class DfAnalyticsService {
  private readonly CACHE_KEY = 'df_dashboard_stats';
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds
  private readonly REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private stats$: Observable<DashboardStats>;

  constructor(private http: HttpClient) {
    // Initialize the stats observable with automatic refresh
    this.stats$ = timer(0, this.REFRESH_INTERVAL).pipe(
      switchMap(() => this.fetchStats()),
      shareReplay(1)
    );
  }

  getDashboardStats(): Observable<DashboardStats> {
    // Check localStorage cache first
    const cached = this.getCachedStats();
    if (cached) {
      return of(cached);
    }

    return this.stats$;
  }

  private fetchStats(): Observable<DashboardStats> {
    // Fetch minimal data to filter out system services
    const requests = {
      services: this.http.get<any>(
        '/api/v2/system/service?fields=id,name,type&include_count=true'
      ),
      roles: this.http.get<any>(
        '/api/v2/system/role?fields=id,name&include_count=true'
      ),
      appKeys: this.http.get<any>('/api/v2/system/app?include_count=true'),
    };

    return forkJoin(requests).pipe(
      map(responses => this.transformResponses(responses)),
      tap(stats => this.cacheStats(stats)),
      catchError(() => {
        // Return simple fallback data if API fails
        return of(this.getSimpleStats());
      })
    );
  }

  private transformResponses(responses: any): DashboardStats {
    const { services, roles, appKeys } = responses;

    // System service names to exclude (comprehensive list of DreamFactory system services)
    // System service names to exclude (comprehensive list of DreamFactory system services)
    const systemServiceNames = [
      'system',
      'api_docs',
      'files',
      'logs',
      'db',
      'email',
      'user',
      'script',
      'ui',
      'schema',
      'api_doc',
      'file',
      'log',
      'admin',
      'df-admin',
      'dreamfactory',
      'cache',
      'push',
      'pub_sub',
    ].map(s => s.toLowerCase());
    // Common system app names - being very specific to avoid filtering user apps
    const systemAppNames = ['admin', 'api_docs', 'file_manager'].map(s =>
      s.toLowerCase()
    );
    const systemRoleNames = ['administrator', 'user', 'admin', 'sys_admin'].map(
      s => s.toLowerCase()
    );

    // Filter services - exclude system services by name
    const userServices = (services.resource || []).filter((s: any) => {
      return !systemServiceNames.includes(s.name.toLowerCase());
    });

    // Filter API Keys - exclude system apps by name
    const userApiKeys = (appKeys.resource || []).filter((a: any) => {
      // Check multiple possible field names for API key
      const apiKeyValue = a.apiKey || a.api_key || a.apikey;
      const hasApiKey = !!apiKeyValue;
      const isSystemApp = systemAppNames.includes(a.name.toLowerCase());

      return !isSystemApp && hasApiKey;
    });

    // Filter roles - exclude system roles by name
    const userRoles = (roles.resource || []).filter((r: any) => {
      return !systemRoleNames.includes(r.name.toLowerCase());
    });

    return {
      services: {
        total: userServices.length,
      },
      apiKeys: {
        total: userApiKeys.length,
      },
      roles: {
        total: userRoles.length,
      },
    };
  }

  private calculateTrend(previous: number, current: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private getCachedStats(): DashboardStats | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < this.CACHE_DURATION) {
        return data;
      }
    } catch {
      // Invalid cache
    }

    localStorage.removeItem(this.CACHE_KEY);
    return null;
  }

  private cacheStats(stats: DashboardStats): void {
    localStorage.setItem(
      this.CACHE_KEY,
      JSON.stringify({
        data: stats,
        timestamp: Date.now(),
      })
    );
  }

  private getSimpleStats(): DashboardStats {
    // Return simple fallback data
    return {
      services: {
        total: 0,
      },
      apiKeys: {
        total: 0,
      },
      roles: {
        total: 0,
      },
    };
  }
}
