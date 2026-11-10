import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { relTime } from 'src/app/adf-data-masking/dm-time';
import { AauthStore } from '../aauth.store';
import { AauthAgent } from '../aauth.types';
import { hostOf } from '../jwt-view';

/** Agents that have called this DreamFactory, with a Blocked switch. */
@Component({
  selector: 'df-aa-agents',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
  templateUrl: './df-aa-agents.component.html',
  styleUrls: ['./df-aa-agents.component.scss'],
})
export class DfAaAgentsComponent implements OnInit {
  readonly store = inject(AauthStore);
  readonly relTime = relTime;
  readonly hostOf = hostOf;

  /** The agent id without "@<provider host>" when the Provider column already shows that host. */
  localId(a: AauthAgent): string {
    const id = a.agentId ?? '';
    const host = hostOf(a.issuer);
    return host && id.endsWith(`@${host}`)
      ? id.slice(0, -(host.length + 1))
      : id;
  }

  ngOnInit(): void {
    this.store.loadAgents(!!this.store.agents);
  }

  trackAgent = (_: number, a: AauthAgent) => a.id;
}
