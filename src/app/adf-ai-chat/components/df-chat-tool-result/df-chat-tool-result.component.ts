import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown,
  faChevronRight,
  faWrench,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { ChatMessage } from '../../types/chat';

@Component({
  selector: 'df-chat-tool-result',
  standalone: true,
  // OnPush is safe: `message` is only ever replaced (fresh API objects),
  // never mutated in place, and `expanded` only changes from this
  // component's own click handler (which marks it dirty under OnPush).
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div
      class="tool-card"
      [class.tool-card--error]="message.is_error"
      [class.tool-card--expanded]="expanded">
      <button
        type="button"
        class="tool-card__header"
        (click)="expanded = !expanded">
        <fa-icon
          [icon]="expanded ? faChevronDown : faChevronRight"
          class="tool-card__chevron"></fa-icon>
        <fa-icon
          [icon]="message.is_error ? faTriangleExclamation : faWrench"
          class="tool-card__icon"></fa-icon>
        <span class="tool-card__title">
          {{ message.tool_name || 'tool' }}
        </span>
        <span *ngIf="message.is_error" class="tool-card__badge">error</span>
        <span *ngIf="message.latency_ms" class="tool-card__latency">
          {{ message.latency_ms }}ms
        </span>
      </button>

      <div *ngIf="expanded" class="tool-card__body">
        <pre class="tool-card__content">{{ pretty }}</pre>
      </div>
    </div>
  `,
  styles: [
    `
      .tool-card {
        border: 1px solid var(--chat-border-2);
        border-radius: var(--df-radius-sm);
        background: var(--chat-surface);
        overflow: hidden;
        font-size: 1.35rem;

        &--error {
          border-color: var(--df-danger-border);
          background: var(--df-danger-soft);
        }

        &__header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          color: inherit;
          font-size: inherit;

          &:hover {
            background: var(--chat-hover);
          }
        }

        &__chevron {
          width: 0.75rem;
          color: var(--chat-text-muted);
        }

        &__icon {
          color: var(--df-accent);
        }

        &--error &__icon {
          color: var(--df-danger);
        }

        &__title {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-weight: 600;
        }

        // !important on badge/latency: dark-style.scss forces span color
        // to white under .dark-theme; tokens keep these AA in both themes.
        &__badge {
          font-size: 11px;
          font-weight: 700;
          padding: 0.125rem 0.4rem;
          border-radius: 4px;
          background: var(--df-danger-soft);
          border: 1px solid var(--df-danger-border);
          color: var(--df-danger) !important;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        &__latency {
          margin-left: auto;
          font-size: 12px;
          color: var(--chat-text-muted) !important;
        }

        &__body {
          border-top: 1px solid var(--df-border-2);
          padding: 0.75rem 1rem;
          background: var(--chat-code-bg);
        }

        &__content {
          margin: 0;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--df-code-text);
          max-height: 320px;
          overflow: auto;
        }
      }
    `,
  ],
})
export class DfChatToolResultComponent implements OnInit {
  @Input({ required: true }) message!: ChatMessage;
  @Input() startExpanded = false;
  expanded = false;

  faChevronDown = faChevronDown;
  faChevronRight = faChevronRight;
  faWrench = faWrench;
  faTriangleExclamation = faTriangleExclamation;

  /** Memo for pretty: tool-result payloads can be KB-sized (query result
   *  sets); JSON parse + pretty-print per CD cycle while expanded is a CD
   *  storm during the chat poll. Keyed on message.content. */
  private prettyCache: { content: string; text: string } | null = null;

  ngOnInit(): void {
    this.expanded = this.startExpanded || !!this.message.is_error;
  }

  get pretty(): string {
    const content = this.message.content ?? '';
    if (this.prettyCache?.content !== content) {
      this.prettyCache = { content, text: this.computePretty(content) };
    }
    return this.prettyCache.text;
  }

  private computePretty(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) {
      return '(empty)';
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return raw;
      }
    }
    return raw;
  }
}
