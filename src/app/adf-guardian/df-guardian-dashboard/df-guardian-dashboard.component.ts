import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GuardianDashboardData } from '../types';
import { GUARDIAN_DASHBOARD_SERVICE_TOKEN } from 'src/app/shared/constants/tokens';
import { DfBaseCrudService } from 'src/app/shared/services/df-base-crud.service';

@Component({
  selector: 'df-guardian-dashboard',
  templateUrl: './df-guardian-dashboard.component.html',
  styleUrls: ['./df-guardian-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    RouterModule,
  ],
})
export class DfGuardianDashboardComponent implements OnInit {
  data: GuardianDashboardData | null = null;
  recentColumns = [
    'method',
    'service',
    'resource',
    'user_email',
    'risk_score',
    'decision',
    'ai_provider',
    'created_at',
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    @Inject(GUARDIAN_DASHBOARD_SERVICE_TOKEN)
    private dashboardService: DfBaseCrudService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ data }) => {
      this.data = data;
    });
  }

  refresh(): void {
    this.dashboardService
      .getAll<GuardianDashboardData>({})
      .subscribe(data => (this.data = data));
  }

  getDecisionClass(decision: string): string {
    const map: Record<string, string> = {
      block: 'decision-block',
      flag: 'decision-flag',
      allow: 'decision-allow',
      review: 'decision-review',
    };
    return map[decision] || '';
  }

  getRiskClass(score: number): string {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleString();
  }
}
