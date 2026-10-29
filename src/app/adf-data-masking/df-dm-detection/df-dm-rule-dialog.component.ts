import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  debounceTime,
  of,
  switchMap,
} from 'rxjs';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { classesByTier } from '../data-masking.catalog';
import { DetectionRule } from '../data-masking.types';
import { errorStatus } from '../data-masking.store';
import { isAppError, normalizeError } from 'src/app/shared/utilities/app-error';
import { TranslocoService } from '@ngneat/transloco';

export type RuleDraft = Pick<DetectionRule, 'match' | 'pattern' | 'class'>;
type Draft = RuleDraft;

/** How the dialog saves: it stays open until this succeeds. */
export interface RuleDialogData {
  save: (draft: RuleDraft) => Observable<unknown>;
}

/** The server's pattern length limit. */
export const MAX_PATTERN = 500;

/**
 * Worth sending. Patterns are PCRE (atomic groups, possessive quantifiers,
 * inline flags, (?P<name>…)), which a JavaScript RegExp cannot judge, so
 * the server decides validity: the live preview shows its reason.
 */
export function validPattern(p: string): boolean {
  return !!p.trim() && p.length <= MAX_PATTERN;
}

/**
 * Add rule: match on column name or value pattern, pick a class, and watch
 * the live preview count the columns it would catch. The preview does the
 * explaining.
 */
@Component({
  selector: 'df-dm-rule-dialog',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatSelectModule,
    TranslocoPipe,
  ],
  templateUrl: './df-dm-rule-dialog.component.html',
  styleUrls: ['./df-dm-rule-dialog.component.scss'],
})
export class DfDmRuleDialogComponent implements OnInit, OnDestroy {
  private api = inject(DfDataMaskingApiService);
  private ref = inject(MatDialogRef<DfDmRuleDialogComponent, boolean>);
  private data = inject<RuleDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private transloco = inject(TranslocoService);

  readonly groups = classesByTier();
  readonly maxPattern = MAX_PATTERN;
  draft: Draft = { match: 'name', pattern: '', class: '' };
  preview: string[] | null = null;
  /** The server ran out of its sampling budget: the count is a floor. */
  partial = false;
  previewing = false;
  saving = false;
  /** The server's reason for refusing the rule, shown in place. */
  saveError: string | null = null;
  /** The server's reason the preview pattern does not compile. */
  testError: string | null = null;
  private test$ = new Subject<void>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.test$
      .pipe(
        debounceTime(250),
        switchMap(() => {
          if (!validPattern(this.draft.pattern)) return of(null);
          this.previewing = true;
          return this.api
            .testRule({ match: this.draft.match, pattern: this.draft.pattern })
            .pipe(
              catchError(e => {
                // A refused pattern says why, in place of a match count.
                this.testError = this.reason(e);
                return of(null);
              })
            );
        })
      )
      .subscribe(r => {
        this.previewing = false;
        if (r) this.testError = null;
        this.preview = r ? r.matches.map(m => m.id) : null;
        this.partial = !!r?.partial;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get invalid(): boolean {
    return (
      (!!this.draft.pattern.trim() && !validPattern(this.draft.pattern)) ||
      !!this.testError
    );
  }

  /** What the preview area says is wrong, if anything. */
  get problem(): string | null {
    if (this.saveError) return this.saveError;
    if (this.testError) return this.testError;
    return this.invalid
      ? this.transloco.translate('dataMasking.detection.invalid')
      : null;
  }

  get canSave(): boolean {
    return (
      validPattern(this.draft.pattern) &&
      !this.testError &&
      !!this.draft.class &&
      !this.saving
    );
  }

  private reason(e: unknown): string {
    const err = isAppError(e) ? e : normalizeError(e);
    return this.transloco.translate(err.fields[0]?.message || err.message);
  }

  /** "1 column" / "4 columns". */
  columnsLabel(count: number): string {
    return this.transloco.translate(
      `dataMasking.plural.columns.${count === 1 ? 'one' : 'other'}`,
      { count }
    );
  }

  changed(): void {
    this.saveError = null;
    this.testError = null;
    if (!validPattern(this.draft.pattern)) this.preview = null;
    this.test$.next();
  }

  save(): void {
    if (!this.canSave) return;
    if (!this.data?.save) {
      this.ref.close(true);
      return;
    }
    this.saving = true;
    this.saveError = null;
    this.data.save({ ...this.draft }).subscribe({
      next: () => this.ref.close(true),
      error: e => {
        this.saving = false;
        // Not allowed (403): the store's toast carries the server's
        // message; the rule itself is fine, so nothing shows in place.
        this.saveError = errorStatus(e) === 403 ? null : this.reason(e);
      },
    });
  }
}
