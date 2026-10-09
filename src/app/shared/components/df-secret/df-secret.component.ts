import {
  Component,
  Input,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { DfPresentationService } from '../../services/df-presentation.service';
import { maskSecret } from '../../utilities/mask';

/**
 * Renders a secret (API key, token) that hides itself while presentation mode
 * is on, with a per-field eye to reveal it again.
 *
 * The real value is never written to the DOM while masked, so it cannot be
 * read off a screenshare, out of a screenshot, or by selecting the text.
 * Copy buttons at the call sites read the value from the model rather than
 * the DOM, so they keep handing Postman the real key either way.
 */
@Component({
  selector: 'df-secret',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, AsyncPipe, FontAwesomeModule],
  template: `
    <ng-container *ngIf="{ on: presentation.on$ | async } as state">
      <code
        class="df-secret__value"
        [class.df-secret__value--masked]="state.on && !revealed"
        [attr.data-masked]="state.on && !revealed ? 'true' : 'false'"
        >{{ displayFor(state.on && !revealed) }}</code
      >
      <button
        *ngIf="state.on && text"
        type="button"
        class="df-secret__eye"
        [attr.aria-label]="revealed ? 'Hide value' : 'Reveal value'"
        [attr.aria-pressed]="revealed"
        [title]="revealed ? 'Hide value' : 'Reveal value'"
        data-testid="secret-eye"
        (click)="toggleReveal($event)">
        <fa-icon [icon]="revealed ? faEyeSlash : faEye"></fa-icon>
      </button>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 100%;
      }
      .df-secret__value {
        overflow-wrap: anywhere;
        /* Lets a host that sets white-space: nowrap and a max-width (a table
           column) truncate the key with an ellipsis instead of overflowing. */
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .df-secret__value--masked {
        /* The mask is one token, not text: wrapping it mid-dots reads as a
           rendering bug in a narrow table column. */
        white-space: nowrap;
        letter-spacing: 2px;
        user-select: none;
        color: var(--df-text-muted);
      }
      .df-secret__eye {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--df-text-muted);
        cursor: pointer;
      }
      .df-secret__eye:hover {
        color: var(--df-text);
      }
    `,
  ],
})
export class DfSecretComponent implements OnDestroy {
  /** Accepts whatever a table cell accessor hands over, not just strings. */
  @Input() value: unknown;

  get text(): string {
    return this.value === null || this.value === undefined
      ? ''
      : String(this.value);
  }

  readonly faEye = faEye;
  readonly faEyeSlash = faEyeSlash;

  revealed = false;

  presentation = inject(DfPresentationService);
  private sub: Subscription;

  constructor() {
    // Flipping presentation mode ON must re-hide anything already revealed —
    // otherwise the switch silently fails to cover the one field you looked at.
    this.sub = this.presentation.on$.subscribe(on => {
      if (on) {
        this.revealed = false;
      }
    });
  }

  /** An empty field stays empty: a mask on nothing would imply a secret that
   *  is not there. */
  displayFor(masked: boolean | null): string {
    return masked ? maskSecret(this.text) : this.text;
  }

  /** stopPropagation because a secret often sits in a clickable table row —
   *  revealing a key must not also navigate away from the list. */
  toggleReveal(event?: Event): void {
    event?.stopPropagation();
    this.revealed = !this.revealed;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
