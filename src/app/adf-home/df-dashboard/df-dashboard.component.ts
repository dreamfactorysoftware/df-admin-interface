import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlug, faKey, faLock } from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil } from 'rxjs';
import {
  DfAnalyticsService,
  DashboardStats,
} from '../../shared/services/df-analytics.service';
import { DfThemeService } from '../../shared/services/df-theme.service';
import { DfBreakpointService } from '../../shared/services/df-breakpoint.service';
import { DfDashboardCardComponent } from './df-dashboard-card/df-dashboard-card.component';

@Component({
  selector: 'df-dashboard',
  templateUrl: './df-dashboard.component.html',
  styleUrls: ['./df-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatDividerModule,
    TranslocoModule,
    FontAwesomeModule,
    DfDashboardCardComponent,
  ],
})
export class DfDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Icons
  faPlug = faPlug; // For API Services
  faKey = faKey; // For API Keys
  faLock = faLock; // For Roles

  stats: DashboardStats = {
    services: { total: 0 },
    apiKeys: { total: 0 },
    roles: { total: 0 },
  };
  loading = true;
  error = false;

  constructor(
    private analyticsService: DfAnalyticsService,
    public themeService: DfThemeService,
    public breakpointService: DfBreakpointService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Clear cache to ensure fresh data
    localStorage.removeItem('df_dashboard_stats');
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardStats(): void {
    this.loading = true;
    this.error = false;

    this.analyticsService
      .getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: stats => {
          this.stats = stats || {
            services: { total: 0 },
            apiKeys: { total: 0 },
            roles: { total: 0 },
          };
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
          // Keep default stats even on error
          this.stats = {
            services: { total: 0 },
            apiKeys: { total: 0 },
            roles: { total: 0 },
          };
        },
      });
  }

  onServicesCardClick(): void {
    if (this.stats.services.total === 0) {
      this.router.navigate(['/api-connections/api-types/database/create']);
    }
  }

  onApiKeysCardClick(): void {
    if (this.stats.apiKeys.total === 0) {
      this.router.navigate(['/api-connections/api-keys/create']);
    }
  }

  onRolesCardClick(): void {
    if (this.stats.roles.total === 0) {
      this.router.navigate(['/api-connections/role-based-access/create']);
    }
  }
}
