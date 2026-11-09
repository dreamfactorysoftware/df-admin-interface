import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { AauthStore } from '../aauth.store';
import { PersonServer } from '../aauth.types';
import { DfAaConfirmDialogComponent } from '../df-aauth/df-aa-confirm-dialog.component';

/**
 * Person Servers the resource trusts: this DreamFactory (always first)
 * and any external ones added by issuer. Each can be limited to a subset
 * of the enabled scopes.
 */
@Component({
  selector: 'df-aa-servers',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfSkeletonComponent,
  ],
  templateUrl: './df-aa-servers.component.html',
  styleUrls: ['./df-aa-servers.component.scss'],
})
export class DfAaServersComponent implements OnInit {
  readonly store = inject(AauthStore);
  private dialog = inject(MatDialog);

  issuer = '';
  /** Scope selection being edited in an open select, by server id. */
  private drafts = new Map<number, string[]>();

  ngOnInit(): void {
    this.store.loadServers(!!this.store.servers);
  }

  get rows(): PersonServer[] {
    const list = this.store.servers ?? [];
    return [...list.filter(s => s.isLocal), ...list.filter(s => !s.isLocal)];
  }

  get canAdd(): boolean {
    return /^https?:\/\/[^\s/]+/i.test(this.issuer.trim());
  }

  add(): void {
    if (!this.canAdd) return;
    this.store.addServer(this.issuer, () => (this.issuer = ''));
  }

  /** Enabled scopes, plus any this server still lists that were disabled. */
  options(s: PersonServer): string[] {
    const enabled = this.store.enabledScopes.map(x => x.scope);
    return [...enabled, ...s.scopes.filter(x => !enabled.includes(x))];
  }

  selected(s: PersonServer): string[] {
    return this.drafts.get(s.id) ?? s.scopes;
  }

  pick(s: PersonServer, scopes: string[]): void {
    this.drafts.set(s.id, scopes);
  }

  /** Saves once the select closes, not on every click. */
  closed(s: PersonServer, open: boolean): void {
    if (open) return;
    const draft = this.drafts.get(s.id);
    this.drafts.delete(s.id);
    if (!draft) return;
    const same =
      draft.length === s.scopes.length &&
      draft.every(x => s.scopes.includes(x));
    if (!same) this.store.updateServer(s.id, { scopes: draft });
  }

  displayName(s: PersonServer): string {
    return s.isLocal
      ? this.store.t('servers.local')
      : s.name || this.hostOf(s.issuer);
  }

  hostOf(issuer: string): string {
    try {
      return new URL(issuer).host;
    } catch {
      return issuer;
    }
  }

  remove(s: PersonServer): void {
    if (s.isLocal) return;
    const name = this.displayName(s);
    this.dialog
      .open(DfAaConfirmDialogComponent, {
        autoFocus: 'dialog',
        data: {
          title: this.store.t('servers.confirmRemove.title', { name }),
          message: this.store.t('servers.confirmRemove.message'),
          confirm: this.store.t('servers.confirmRemove.confirm'),
          cancel: this.store.t('cancel'),
        },
      })
      .afterClosed()
      .subscribe(ok => {
        if (ok) this.store.deleteServer(s.id);
      });
  }

  trackServer = (_: number, s: PersonServer) => s.id;
}
