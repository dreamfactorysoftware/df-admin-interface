import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { Subscription } from 'rxjs';
import { DfPaywallComponent } from 'src/app/shared/components/df-paywall/df-paywall.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { AauthStore } from '../aauth.store';
import { AauthCounts } from '../aauth.types';
import { DfAaCopyComponent } from '../df-aa-copy/df-aa-copy.component';
import { DfAaScopesComponent } from '../df-aa-scopes/df-aa-scopes.component';
import { DfAaServersComponent } from '../df-aa-servers/df-aa-servers.component';
import { DfAaAgentsComponent } from '../df-aa-agents/df-aa-agents.component';
import { DfAaActivityComponent } from '../df-aa-activity/df-aa-activity.component';
import { DfAaGrantsComponent } from '../df-aa-grants/df-aa-grants.component';
import { DfAaTryComponent } from '../df-aa-try/df-aa-try.component';

export type AaTab =
  | 'scopes'
  | 'servers'
  | 'agents'
  | 'activity'
  | 'grants'
  | 'try';

export const AA_TABS: AaTab[] = [
  'scopes',
  'servers',
  'agents',
  'activity',
  'grants',
  'try',
];

/** Which overview count a tab label carries. */
const TAB_COUNT: Partial<Record<AaTab, keyof AauthCounts>> = {
  scopes: 'scopesEnabled',
  servers: 'personServers',
  agents: 'agents',
  grants: 'grants',
};

/**
 * AAuth page shell (/api-security/aauth). The admin chrome already prints
 * the H1, so the shell carries the one primary control (Enabled), the
 * issuer, and the tab bar. The tab lives in ?tab= so links and reloads
 * keep it. Without the df-aauth package (GOLD) the route resolves to
 * 'paywall' and the shell shows only the standard paywall.
 */
@Component({
  selector: 'df-aauth',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTooltipModule,
    TranslocoPipe,
    DfPaywallComponent,
    DfSkeletonComponent,
    DfEmptyStateComponent,
    DfAaCopyComponent,
    DfAaScopesComponent,
    DfAaServersComponent,
    DfAaAgentsComponent,
    DfAaActivityComponent,
    DfAaGrantsComponent,
    DfAaTryComponent,
  ],
  providers: [AauthStore],
  templateUrl: './df-aauth.component.html',
  styleUrls: ['./df-aauth.component.scss'],
})
export class DfAauthComponent implements OnInit, OnDestroy {
  readonly store = inject(AauthStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly tabs = AA_TABS;
  paywall = false;
  tab: AaTab = 'scopes';
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.subs.push(
      this.route.data.subscribe(d => {
        this.paywall = d?.['data'] === 'paywall';
        if (this.paywall) return;
        if (!this.store.overview) this.store.load();
      }),
      this.route.queryParamMap.subscribe(q => {
        const t = q.get('tab') as AaTab | null;
        this.tab = t && AA_TABS.includes(t) ? t : 'scopes';
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.store.stopPolling();
  }

  count(tab: AaTab): number | null {
    const key = TAB_COUNT[tab];
    const counts = this.store.overview?.counts;
    if (!key || !counts) return null;
    const n = counts[key];
    return typeof n === 'number' ? n : null;
  }

  tabQuery(tab: AaTab): Record<string, string | null> {
    return { tab: tab === 'scopes' ? null : tab };
  }

  setTab(tab: AaTab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.tabQuery(tab),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
