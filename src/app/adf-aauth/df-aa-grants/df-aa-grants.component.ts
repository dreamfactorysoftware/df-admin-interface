import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { relTime } from 'src/app/adf-data-masking/dm-time';
import { AauthStore } from '../aauth.store';
import { AauthGrant } from '../aauth.types';
import { DfAaConfirmDialogComponent } from '../df-aauth/df-aa-confirm-dialog.component';
import { hostOf, splitScopes } from '../jwt-view';

/** Standing "Always allow" grants people gave agents, with Revoke. */
@Component({
  selector: 'df-aa-grants',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
  templateUrl: './df-aa-grants.component.html',
  styleUrls: ['./df-aa-grants.component.scss'],
})
export class DfAaGrantsComponent implements OnInit {
  readonly store = inject(AauthStore);
  private dialog = inject(MatDialog);
  readonly relTime = relTime;
  readonly hostOf = hostOf;
  readonly splitScopes = splitScopes;

  ngOnInit(): void {
    this.store.loadGrants(!!this.store.grants);
  }

  person(g: AauthGrant): string {
    return g.userName || g.userEmail || `#${g.userId}`;
  }

  agent(g: AauthGrant): string {
    return g.agentName || g.agentSub;
  }

  revoke(g: AauthGrant): void {
    this.dialog
      .open(DfAaConfirmDialogComponent, {
        autoFocus: 'dialog',
        data: {
          title: this.store.t('grants.confirmRevoke.title'),
          message: this.store.t('grants.confirmRevoke.message', {
            agent: this.agent(g),
            person: this.person(g),
          }),
          confirm: this.store.t('grants.confirmRevoke.confirm'),
          cancel: this.store.t('cancel'),
        },
      })
      .afterClosed()
      .subscribe(ok => {
        if (ok) this.store.revokeGrant(g.id);
      });
  }

  trackGrant = (_: number, g: AauthGrant) => g.id;
}
