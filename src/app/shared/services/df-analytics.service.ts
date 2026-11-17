import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { silent } from '../utilities/http-contexts';
import { filterUserServices } from '../utilities/user-services';

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

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    // Check localStorage cache first
    const cached = this.getCachedStats();
    if (cached) {
      return of(cached);
    }

    // Fetch fresh rather than replaying an earlier count: that count predates
    // the user's first API and would keep them "first-time" after creating it.
    return this.fetchStats();
  }

  /** Drop the cached stats, e.g. after a service create changed the count. */
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  private fetchStats(): Observable<DashboardStats> {
    // Fetch minimal data to filter out auto-provisioned services
    // (created_by_id is part of that rule, see isAutoProvisionedService).
    // Silent by design: roles without system permissions degrade gracefully
    // to the catchError fallback instead of triggering the error interceptor.
    const context = silent();
    const requests = {
      services: this.http.get<any>(
        '/api/v2/system/service?fields=id,name,type,created_by_id&include_count=true',
        { context }
      ),
      roles: this.http.get<any>(
        '/api/v2/system/role?fields=id,name&include_count=true',
        { context }
      ),
      appKeys: this.http.get<any>('/api/v2/system/app?include_count=true', {
        context,
      }),
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

    // Common system app names - being very specific to avoid filtering user apps
    const systemAppNames = ['admin', 'api_docs', 'file_manager'].map(s =>
      s.toLowerCase()
    );
    const systemRoleNames = ['administrator', 'user', 'admin', 'sys_admin'].map(
      s => s.toLowerCase()
    );

    // Exclude the services DreamFactory and its packages provision at install
    // (system, api_docs, ..., plus api_builder / agents on commercial builds)
    const userServices = filterUserServices(services.resource);

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
