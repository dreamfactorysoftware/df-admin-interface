import { Component, Input } from '@angular/core';
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
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
        overflow: hidden;
        font-size: 0.875rem;

        &--error {
          border-color: rgba(220, 53, 69, 0.4);
          background: rgba(220, 53, 69, 0.06);
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
            background: rgba(255, 255, 255, 0.04);
          }
        }

        &__chevron {
          width: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        &__icon {
          color: #60a5fa;
        }

        &--error &__icon {
          color: #ff6b6b;
        }

        &__title {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-weight: 600;
        }

        &__badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.125rem 0.4rem;
          border-radius: 3px;
          background: rgba(220, 53, 69, 0.25);
          color: #ff8585;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        &__latency {
          margin-left: auto;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        &__body {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.75rem 1rem;
          background: rgba(0, 0, 0, 0.25);
        }

        &__content {
          margin: 0;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 0.8125rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          color: rgba(255, 255, 255, 0.9);
          max-height: 320px;
          overflow: auto;
        }
      }
    `,
  ],
})
export class DfChatToolResultComponent {
  @Input({ required: true }) message!: ChatMessage;
  @Input() startExpanded = false;
  expanded = false;

  faChevronDown = faChevronDown;
  faChevronRight = faChevronRight;
  faWrench = faWrench;
  faTriangleExclamation = faTriangleExclamation;

  ngOnInit(): void {
    this.expanded = this.startExpanded;
  }

  get pretty(): string {
    const raw = this.message.content ?? '';
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
