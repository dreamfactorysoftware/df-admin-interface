import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// df-empty-state: the reusable teaching empty state (Meridian Phase 0).
//
// Generalizes the emptyStateMessage/emptyStateActionLabel pattern that lived
// inline on df-manage-table into one primitive every empty list, metrics pane
// and log view composes. Voice is terse and confident (spec section 3): a
// one-line headline, a one-line helper that names the ONE upstream action, and
// a single primary CTA. For metrics/logs the helper points at the action that
// fills the view ("Calls appear here once a key makes a request.").
//
// Presentational only: it owns no copy, so it owns no i18n. Consumers pass
// display-ready strings (`[title]="'emptyState.services.title' | transloco"`),
// which keeps the primitive translation-agnostic and lets dynamic values flow
// through unchanged. Tokens only, so light/dark/phosphor resolve for free.
//
// Slots:
//   [emptyStateIcon]    - custom icon markup, overrides the `icon` input chip.
//   [emptyStateSnippet] - optional trailing block (a curl sample, a hint card).
@Component({
  selector: 'df-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, MatButtonModule, MatIconModule],
  templateUrl: './df-empty-state.component.html',
  styleUrls: ['./df-empty-state.component.scss'],
})
export class DfEmptyStateComponent {
  // Material icon ligature for the centered chip. Omit to use the
  // [emptyStateIcon] slot or no icon at all.
  @Input() icon?: string;
  @Input({ required: true }) title = '';
  @Input() description?: string;
  // Primary CTA. No label => no button (some empty states only teach).
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  // Optional lower-emphasis secondary CTA (e.g. "Provision sample database").
  @Input() secondaryLabel?: string;

  @Output() action = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
}
