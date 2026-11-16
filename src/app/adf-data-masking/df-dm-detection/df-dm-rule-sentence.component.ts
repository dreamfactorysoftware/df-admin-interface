import { Component, Input, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';
import { DetectionRule } from '../data-masking.types';
import { RuleShape, RuleTarget, describeRule } from '../rule-pattern';

type Rule = Pick<DetectionRule, 'match' | 'pattern'> & {
  title?: string | null;
};
/** Translates a key under dataMasking.detection. */
type Translate = (key: string, params?: Record<string, unknown>) => string;

/**
 * "Column name is", "Column values look like", "… matches regex"; just
 * "Column name" before a baseline rule's own name.
 */
export function ruleLead(t: Translate, rule: Rule, shape: RuleShape): string {
  const target = t(rule.match === 'name' ? 'matchName' : 'matchValue');
  if (rule.title) return target;
  return t('sentence', { target, op: t(`ops.${rule.match}.${shape.op}`) });
}

/**
 * The rule as one line of text, for places without chips (a filter label,
 * a confirm message): "Column values look like ###-##-####", a baseline
 * rule's name, or the lead and the regex.
 */
export function ruleSentence(t: Translate, rule: Rule): string {
  if (rule.title) return rule.title;
  const shape = describeRule(rule.match, rule.pattern);
  const rest =
    shape.op === 'regex' ? rule.pattern : shape.terms.join(` ${t('or')} `);
  return `${ruleLead(t, rule, shape)} ${rest}`;
}

/**
 * A detection rule as the sentence that wrote it: a muted lead ("Column
 * name is"), then the terms as mono chips joined by a muted "or". A regex
 * the builder did not write stays the regex; a baseline rule shows its
 * name. Either way the full pattern is the title. The rule list and
 * Activity both read rules this way.
 */
@Component({
  selector: 'df-dm-rule-sentence',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './df-dm-rule-sentence.component.html',
  styleUrls: ['./df-dm-rule-sentence.component.scss'],
})
export class DfDmRuleSentenceComponent {
  private transloco = inject(TranslocoService);

  @Input({ required: true }) match!: RuleTarget;
  @Input({ required: true }) pattern!: string;
  /** A baseline rule's name, shown instead of its regex. */
  @Input() title?: string | null;

  private memo?: { key: string; shape: RuleShape };

  get shape(): RuleShape {
    const key = `${this.match}\u0000${this.pattern}`;
    if (this.memo?.key !== key) {
      this.memo = { key, shape: describeRule(this.match, this.pattern) };
    }
    return this.memo.shape;
  }

  /** The terms, or null for a regex. */
  get terms(): string[] | null {
    const shape = this.shape;
    return shape.op === 'regex' ? null : shape.terms;
  }

  get lead(): string {
    return ruleLead(this.t, this, this.shape);
  }

  get or(): string {
    return this.t('or');
  }

  private t: Translate = (key, params) =>
    this.transloco.translate(`dataMasking.detection.${key}`, params);
}
