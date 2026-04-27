import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faChartLine,
  faMessage,
} from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import { UsageBundle, UsageService } from './services/usage.service';
import { GroupRow, TimeRange, UsageSummary } from './types/usage';
import {
  filterByRange,
  groupBy,
  summarize,
  timeSeries,
} from './utils/aggregate';
import { DfUsageStackedAreaComponent } from './components/df-usage-stacked-area/df-usage-stacked-area.component';
import { DfUsageBarsComponent } from './components/df-usage-bars/df-usage-bars.component';
import { DfUsageSummaryComponent } from './components/df-usage-summary/df-usage-summary.component';
import { DfCostEstimatorComponent } from './components/df-cost-estimator/df-cost-estimator.component';

@Component({
  selector: 'df-ai-usage',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
    DfUsageStackedAreaComponent,
    DfUsageBarsComponent,
    DfUsageSummaryComponent,
    DfCostEstimatorComponent,
  ],
  templateUrl: './df-ai-usage.component.html',
  styleUrls: ['./df-ai-usage.component.scss'],
})
export class DfAiUsageComponent implements OnInit {
  private api = inject(UsageService);
  private router = inject(Router);

  loading = true;
  errorMessage: string | null = null;
  bundle: UsageBundle | null = null;

  range: TimeRange = '7d';

  faArrowsRotate = faArrowsRotate;
  faChartLine = faChartLine;
  faMessage = faMessage;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api
      .loadAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: bundle => (this.bundle = bundle),
        error: err => {
          this.errorMessage =
            err?.error?.error?.message ??
            err?.message ??
            'Failed to load usage.';
        },
      });
  }

  setRange(range: TimeRange): void {
    this.range = range;
  }

  get filteredSessions() {
    if (!this.bundle) {
      return [];
    }
    return filterByRange(this.bundle.sessions, this.range);
  }

  get summary(): UsageSummary {
    return summarize(this.filteredSessions);
  }

  get series() {
    return timeSeries(this.filteredSessions, this.range);
  }

  get byUser(): GroupRow[] {
    return groupBy(this.filteredSessions, 'user', {
      users: this.bundle?.users,
    });
  }

  get byRole(): GroupRow[] {
    return groupBy(this.filteredSessions, 'role', {
      roles: this.bundle?.roles,
    });
  }

  get byService(): GroupRow[] {
    return groupBy(this.filteredSessions, 'service');
  }

  jumpToService(row: GroupRow): void {
    this.router.navigate(['/ai/chat'], {
      queryParams: { service: row.key },
    });
  }
}
