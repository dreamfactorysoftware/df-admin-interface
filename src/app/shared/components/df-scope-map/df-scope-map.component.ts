import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoModule } from '@ngneat/transloco';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import {
  DfScopeService,
  ReachEntry,
} from 'src/app/shared/services/df-scope.service';

/** One service's grants, grouped for a single expansion panel. */
interface ScopeMapGroup {
  serviceId: number | null;
  serviceLabel: string;
  serviceName: string;
  entries: ReachEntry[];
  /** All entries in the group came in via a wildcard the role inherited. */
  allInherited: boolean;
  allow: boolean;
}

/**
 * df-scope-map — the resolved "what this identity can reach" view.
 *
 * Point it at a roleId, or a keyId/agentId that resolves to a role, and it
 * renders the actual services + tables/endpoints that role grants as an
 * expansion-panel list. Each entry carries an allow/deny state and an
 * inherited-from-role vs explicit df-badge: the Credal inheritance model,
 * resolved inline. Derived client-side from the same role graph df-scope-matrix
 * reads. Tokens only, legible in light, dark, and phosphor.
 */
@Component({
  selector: 'df-scope-map',
  standalone: true,
  templateUrl: './df-scope-map.component.html',
  styleUrls: ['./df-scope-map.component.scss'],
  imports: [
    CommonModule,
    MatExpansionModule,
    TranslocoModule,
    DfBadgeComponent,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
})
export class DfScopeMapComponent implements OnChanges, OnDestroy {
  /** Resolve reach directly from a role. */
  @Input() roleId?: number | null;
  /** Resolve reach from an API key/app's attached role. */
  @Input() keyId?: number | null;
  /** Resolve reach from an AI agent's attached role. */
  @Input() agentId?: number | null;

  groups: ScopeMapGroup[] = [];
  loading = false;
  resolved = true;

  private destroy$ = new Subject<void>();

  constructor(private scope: DfScopeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('roleId' in changes || 'keyId' in changes || 'agentId' in changes) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByGroup(_: number, group: ScopeMapGroup): string {
    return `${group.serviceId}:${group.serviceName}`;
  }

  trackByEntry(_: number, entry: ReachEntry): string {
    return `${entry.serviceId}:${entry.component}`;
  }

  private load(): void {
    this.groups = [];
    const source = this.reachSource();
    if (!source) {
      this.resolved = false;
      return;
    }
    this.resolved = true;
    this.loading = true;
    source.pipe(takeUntil(this.destroy$)).subscribe(entries => {
      this.loading = false;
      this.groups = this.group(entries);
    });
  }

  private reachSource(): Observable<ReachEntry[]> | null {
    if (this.roleId != null) {
      return this.scope.reachForRole(this.roleId);
    }
    if (this.keyId != null) {
      return this.scope.reachForKey(this.keyId);
    }
    if (this.agentId != null) {
      return this.scope.reachForAgent(this.agentId);
    }
    return null;
  }

  private group(entries: ReachEntry[]): ScopeMapGroup[] {
    const byService = new Map<string, ScopeMapGroup>();
    for (const entry of entries) {
      const key = `${entry.serviceId}:${entry.serviceName}`;
      let group = byService.get(key);
      if (!group) {
        group = {
          serviceId: entry.serviceId,
          serviceLabel: entry.serviceLabel,
          serviceName: entry.serviceName,
          entries: [],
          allInherited: true,
          allow: false,
        };
        byService.set(key, group);
      }
      group.entries.push(entry);
      group.allInherited = group.allInherited && entry.source === 'inherited';
      group.allow = group.allow || entry.allow;
    }
    return Array.from(byService.values());
  }
}
