import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

/**
 * df-badge — the single status/label vocabulary for the admin UI.
 *
 * A small pill: an optional status dot plus a caller-provided label, on a
 * ~10% alpha wash pulled entirely from `--df-*` tokens (legible in light,
 * dark, and phosphor). Use it for service state, key state, connection
 * health, MCP status, lifecycle, inherited-vs-explicit scope, and section
 * category tags. It replaces every ad-hoc `mat-chip` color and the loud
 * solid status circles. No color or size literals — literals break phosphor.
 *
 * `variant` covers the status vocabulary (neutral | success | warning |
 * danger), the single brand `accent`, and the section category tints
 * (build | data | security | system | admin | ai | docs). Category tints are
 * an identity cue, never a pass/fail signal — hide the dot for those.
 *
 * The label is already-translated text supplied by the caller, so the
 * component holds no static copy of its own.
 *
 * @example
 *   <df-badge variant="success" label="Active"></df-badge>
 *   <df-badge variant="danger" label="Failed"></df-badge>
 *   <df-badge variant="warning" label="Degraded"></df-badge>
 *   <df-badge variant="ai" label="AI" [dot]="false"></df-badge>
 */
@Component({
  selector: 'df-badge',
  templateUrl: './df-badge.component.html',
  styleUrls: ['./df-badge.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class DfBadgeComponent {
  /** Status vocabulary + brand accent + section category tints. */
  @Input() variant: BadgeVariant = 'neutral';
  /** Caller-provided (already-translated) text. */
  @Input() label = '';
  /** Show the leading status dot. Hide it for pure category tags. */
  @Input() dot = true;

  get variantClass(): string {
    return `df-badge--${this.variant}`;
  }
}

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'build'
  | 'data'
  | 'security'
  | 'system'
  | 'admin'
  | 'ai'
  | 'docs';
