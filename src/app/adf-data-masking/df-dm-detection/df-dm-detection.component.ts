import {
  Component,
  EventEmitter,
  Injector,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@ngneat/transloco';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfSkeletonComponent } from 'src/app/shared/components/df-skeleton/df-skeleton.component';
import { DfDataMaskingApiService } from '../data-masking-api.service';
import { DataMaskingStore } from '../data-masking.store';
import { baselineDef, classDef, classesByTier } from '../data-masking.catalog';
import { DetectionRule } from '../data-masking.types';
import {
  DfDmRuleDialogComponent,
  RuleDialogData,
} from './df-dm-rule-dialog.component';
import {
  DfDmRuleSentenceComponent,
  ruleSentence,
} from './df-dm-rule-sentence.component';
import {
  DfDmConfirmDialogComponent,
  DmConfirmData,
} from '../df-data-masking/df-dm-confirm-dialog.component';

/**
 * Detection tab: custom rules on top of the built-in ruleset, each read as
 * the sentence that wrote it ("Column name is emp_ssn or social_sec"). A
 * rule's Matches count opens Columns filtered to exactly those columns.
 */
@Component({
  selector: 'df-dm-detection',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoPipe,
    DfEmptyStateComponent,
    DfSkeletonComponent,
    DfDmRuleSentenceComponent,
  ],
  templateUrl: './df-dm-detection.component.html',
  styleUrls: ['./df-dm-detection.component.scss'],
})
export class DfDmDetectionComponent implements OnInit {
  readonly store = inject(DataMaskingStore);
  private api = inject(DfDataMaskingApiService);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  private transloco = inject(TranslocoService);

  @Output() showMatches = new EventEmitter<void>();

  builtInOpen = false;
  readonly groups = classesByTier();

  ngOnInit(): void {
    if (!this.store.rules) this.store.loadRules();
  }

  tierOf(cls: string): string {
    return classDef(cls)?.tier ?? 'clear';
  }

  /** The baseline that added a rule (source `baseline:<id>`), or null. */
  baselineOf(r: DetectionRule): string | null {
    const id = r.source?.startsWith('baseline:')
      ? r.source.slice('baseline:'.length)
      : '';
    return id ? (baselineDef(id)?.name ?? id) : null;
  }

  /** "Column values look like ###-##-####": the rule as one line. */
  sentenceOf(r: DetectionRule): string {
    return ruleSentence(
      (k, p) => this.transloco.translate(`dataMasking.detection.${k}`, p),
      r
    );
  }

  /** A value rule's count waits for the running scan (it may apply it). */
  pending(r: DetectionRule): boolean {
    return r.match === 'value' && this.store.scanning;
  }

  detectorsFor(cls: string): string[] {
    return (
      this.store.builtin?.classes.find(c => c.class === cls)?.detectors ?? []
    );
  }

  /**
   * The dialog saves through the store and stays open on a refusal. It
   * opens in this injector so it reaches the page's store (its column
   * names): MatDialog's own injector is above the page. Its width is fixed
   * (narrower only on a small screen), so it never resizes as chips come
   * and go; focus starts in the term input (cdkFocusInitial).
   */
  addRule(): void {
    const data: RuleDialogData = { save: d => this.store.addRule(d) };
    this.dialog.open(DfDmRuleDialogComponent, {
      autoFocus: 'first-tabbable',
      width: '560px',
      maxWidth: 'calc(100vw - 32px)',
      injector: this.injector,
      data,
    });
  }

  /**
   * Delete asks first, naming the rule, and says what happens to its
   * columns: they stay masked (automatic changes never unmask). When some
   * were masked by this rule alone, a second button unmasks those too.
   */
  deleteRule(rule: DetectionRule): void {
    const t = (k: string, p?: Record<string, unknown>) => this.store.t(k, p);
    const { masked, ruleOnly } = this.store.footprint(rule);
    const kept = masked.length
      ? t('detection.deleteKept', {
          columns: this.store.plural('columns', masked.length),
        })
      : '';
    const data: DmConfirmData = {
      title: t('detection.deleteTitle'),
      message: [this.sentenceOf(rule), kept].filter(Boolean).join('\n'),
      confirm: t('detection.deleteConfirm'),
      cancel: t('cancel'),
      danger: true,
      extra: ruleOnly.length
        ? t('detection.deleteUnmask', { count: ruleOnly.length })
        : undefined,
    };
    this.dialog
      .open(DfDmConfirmDialogComponent, { data, autoFocus: 'dialog' })
      .afterClosed()
      .subscribe(choice => {
        if (choice === 'extra') this.store.deleteRule(rule, ruleOnly);
        else if (choice) this.store.deleteRule(rule);
      });
  }

  openMatches(rule: DetectionRule): void {
    this.api.testRule({ match: rule.match, pattern: rule.pattern }).subscribe({
      next: r => {
        this.store.showColumns('all', {
          label: this.sentenceOf(rule),
          ids: new Set(r.matches.map(m => m.id)),
        });
        this.showMatches.emit();
      },
      error: e => this.store.fail(e),
    });
  }

  trackRule = (_: number, r: DetectionRule) => r.id;
}
