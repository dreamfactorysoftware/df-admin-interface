import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// df-disclosure: a page section that starts closed.
//
// One hairline row — eyebrow, title, an optional one-line summary — and a
// chevron. The whole row is the button. Content is projected and only
// rendered while open, so a heavy section (a roles x verbs matrix with
// hundreds of rows) costs nothing until someone asks for it. The summary is
// what makes a closed section still useful: pass the one fact a reader wants
// without opening it (a base URL, "12 of 313 roles").
//
// Presentational only: it owns no copy, so it owns no i18n. Consumers pass
// display-ready strings. Tokens only: light/dark/phosphor for free.
let nextId = 0;

@Component({
  selector: 'df-disclosure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, MatIconModule],
  templateUrl: './df-disclosure.component.html',
  styleUrls: ['./df-disclosure.component.scss'],
})
export class DfDisclosureComponent {
  @Input() eyebrow?: string;
  @Input({ required: true }) title = '';
  @Input() description?: string;
  /** One line shown at the right of the header while closed or open. */
  @Input() summary?: string | null;
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  readonly panelId = `df-disclosure-${nextId++}`;

  toggle(): void {
    this.open = !this.open;
    this.openChange.emit(this.open);
  }
}
