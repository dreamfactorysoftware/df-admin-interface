import { Component, Inject, OnDestroy } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TranslocoPipe } from '@ngneat/transloco';
import { Observable, Subscription } from 'rxjs';
import { BaselineChange } from '../compliance.types';

export interface ApplyDialogData {
  name: string;
  /** Exactly the server's `changes`, in its order. */
  changes: BaselineChange[];
  /**
   * Offer turning masking on: a scan has finished (the server refuses On
   * before the first scan) and masking is not on already.
   */
  offerTurnOn: boolean;
  /** Start with "turn masking on" ticked (the Fix of "Masking is on"). */
  turnOn?: boolean;
  /**
   * The server's list for Apply with masking turned on (`changes` plus the
   * mode change), shown while "also turn masking on" is checked.
   */
  changesOn$?: Observable<BaselineChange[]>;
}

export interface ApplyDialogResult {
  turnOn: boolean;
}

/**
 * Apply confirm: the list of what will change is the message, exactly as
 * the server reports it for the choice made (with or without turning
 * masking on). Closes with `{ turnOn }` on Apply, undefined on Cancel.
 */
@Component({
  selector: 'df-compliance-apply-dialog',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ 'compliance.applyDialog.title' | transloco: { name: data.name } }}
    </h2>
    <div mat-dialog-content class="body">
      <ul
        class="changes"
        *ngIf="shown.length; else none"
        data-testid="cp-apply-changes">
        <li *ngFor="let c of shown; trackBy: trackChange">
          {{ c.text }}
        </li>
      </ul>
      <ng-template #none>
        <!-- Not while turning masking on: that is a change. -->
        <p class="none" *ngIf="!turnOn" data-testid="cp-apply-none">
          {{ 'compliance.applyDialog.none' | transloco }}
        </p>
      </ng-template>
      <mat-checkbox
        *ngIf="data.offerTurnOn"
        class="turn-on"
        color="primary"
        [(ngModel)]="turnOn"
        data-testid="cp-apply-turn-on">
        {{ 'compliance.applyDialog.turnOn' | transloco }}
      </mat-checkbox>
    </div>
    <div mat-dialog-actions align="end">
      <button
        mat-button
        type="button"
        [mat-dialog-close]="undefined"
        data-testid="cp-apply-cancel">
        {{ 'compliance.cancel' | transloco }}
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        cdkFocusInitial
        [mat-dialog-close]="{ turnOn: data.offerTurnOn && turnOn }"
        data-testid="cp-apply-confirm">
        {{ 'compliance.applyDialog.confirm' | transloco }}
      </button>
    </div>
  `,
  styles: [
    `
      @use '../../shared/components/df-dialog-surface' as *;
      @include df-dialog-surface;

      .body {
        color: var(--df-text-2);
        font-size: var(--df-font-size-sm);
        max-width: 480px;
      }

      .changes {
        display: flex;
        flex-direction: column;
        gap: var(--df-space-2);
        list-style: none;
        margin: 0 0 var(--df-space-4);
        max-height: 40vh;
        overflow-y: auto;
        padding: 0;
      }

      .changes li {
        color: var(--df-text);
        line-height: var(--df-lh-base);
        padding-left: var(--df-space-4);
        position: relative;
      }

      // A small accent tick per change: reads as a list of edits.
      .changes li::before {
        background: var(--df-accent);
        border-radius: 50%;
        content: '';
        height: 6px;
        left: 2px;
        position: absolute;
        top: 0.6em;
        width: 6px;
      }

      .none {
        margin: 0 0 var(--df-space-4);
      }

      .turn-on {
        margin-left: calc(-1 * var(--df-space-2));
      }
    `,
  ],
})
export class DfComplianceApplyDialogComponent implements OnDestroy {
  turnOn: boolean;
  /** The server's list with masking turned on; null until it arrives. */
  private changesOn: BaselineChange[] | null = null;
  private sub?: Subscription;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ApplyDialogData) {
    this.turnOn = !!(data.offerTurnOn && data.turnOn);
    if (data.offerTurnOn && data.changesOn$) {
      // A failed read keeps the plain list: Apply still does what it says.
      this.sub = data.changesOn$.subscribe({
        next: c => (this.changesOn = c),
        error: () => undefined,
      });
    }
  }

  /** What Apply will change for the current choice. */
  get shown(): BaselineChange[] {
    return this.turnOn && this.changesOn ? this.changesOn : this.data.changes;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  trackChange = (_: number, c: BaselineChange) => c.id;
}
