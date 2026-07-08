import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ChatSession } from '../../types/chat';

@Component({
  selector: 'df-chat-session-list',
  standalone: true,
  // OnPush is safe: the parent always reassigns `sessions` (never mutates
  // the array or its rows in place) and the other inputs are primitives.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, FontAwesomeModule],
  template: `
    <aside class="session-list">
      <button
        type="button"
        mat-flat-button
        color="primary"
        class="session-list__new"
        (click)="newSession.emit()">
        <fa-icon [icon]="faPlus"></fa-icon>
        <span>New chat</span>
      </button>

      <div *ngIf="loading" class="session-list__empty">Loading…</div>

      <div
        *ngIf="!loading && sessions.length === 0"
        class="session-list__empty">
        No sessions yet.
      </div>

      <ul *ngIf="!loading && sessions.length > 0" class="session-list__items">
        <li
          *ngFor="let s of sessions; trackBy: trackById"
          class="session-list__item"
          [class.session-list__item--active]="s.id === activeId">
          <button
            type="button"
            class="session-list__item-button"
            (click)="select.emit(s)">
            <span class="session-list__title">
              {{ s.title || 'Session ' + s.id }}
            </span>
            <span class="session-list__meta">
              {{ s.tool_call_count || 0 }} tool calls ·
              {{ formatTime(s.updated_at) }}
            </span>
          </button>
          <button
            type="button"
            class="session-list__delete"
            (click)="delete.emit(s)"
            title="Delete session">
            <fa-icon [icon]="faTrashCan"></fa-icon>
          </button>
        </li>
      </ul>
    </aside>
  `,
  styles: [
    `
      .session-list {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--chat-surface);
        border-right: 1px solid var(--chat-border-2);
        overflow: hidden;

        &__new {
          margin: 0.875rem;
          flex-shrink: 0;
          display: inline-flex !important;
          align-items: center;
          gap: 0.5rem;
          border-radius: var(--df-radius-sm) !important;
        }

        &__empty {
          padding: 1rem 1rem 0;
          color: var(--chat-text-muted);
          font-style: italic;
          font-size: 1.3rem;
        }

        &__items {
          flex: 1;
          overflow-y: auto;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        // Sidebar density language: 44px rows, hairline separators,
        // active state on the accent wash + inset accent bar.
        &__item {
          display: flex;
          align-items: stretch;
          min-height: 44px;
          border-bottom: 1px solid var(--chat-border-2);

          &--active {
            background: var(--df-accent-soft);
            box-shadow: inset 2px 0 0 var(--df-accent);
          }

          &:hover:not(.session-list__item--active) {
            background: var(--chat-hover);
          }
        }

        &__item-button {
          flex: 1;
          // min-width: 0 lets the button shrink below its content so long
          // titles ellipsize instead of clipping at the panel edge (flex
          // children default to min-width: auto, which blocks text-overflow).
          min-width: 0;
          background: none;
          border: none;
          color: inherit;
          text-align: left;
          padding: 6px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          font-family: inherit;
          font-size: inherit;
        }

        &__title {
          font-weight: 500;
          font-size: 1.3rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        // !important: dark-style.scss forces span/button color to white
        // under .dark-theme; these keep the muted hierarchy in both themes.
        &__meta {
          font-size: 1.1rem;
          color: var(--chat-text-muted) !important;
        }

        &__delete {
          background: none;
          border: none;
          color: var(--chat-text-faint) !important;
          cursor: pointer;
          padding: 0.5rem 0.875rem;
          font-size: 1.3rem;

          &:hover {
            color: var(--df-danger) !important;
          }
        }
      }
    `,
  ],
})
export class DfChatSessionListComponent {
  @Input() sessions: ChatSession[] = [];
  @Input() activeId: number | null = null;
  @Input() loading = false;

  @Output() select = new EventEmitter<ChatSession>();
  @Output() newSession = new EventEmitter<void>();
  @Output() delete = new EventEmitter<ChatSession>();

  faPlus = faPlus;
  faTrashCan = faTrashCan;

  trackById(_: number, s: ChatSession): number {
    return s.id;
  }

  /** Memo for formatTime: toLocaleTimeString/-DateString build an Intl
   *  DateTimeFormat per call, and this runs per session row per CD cycle
   *  (the chat poll ticks every second). Cache is invalidated when the
   *  calendar day rolls over so the same-day/short-date split stays fresh. */
  private timeCache = new Map<string, string>();
  private timeCacheDay = '';

  formatTime(iso?: string): string {
    if (!iso) {
      return '';
    }
    const day = new Date().toDateString();
    if (day !== this.timeCacheDay) {
      this.timeCacheDay = day;
      this.timeCache.clear();
    }
    const hit = this.timeCache.get(iso);
    if (hit !== undefined) {
      return hit;
    }
    const text = this.computeTime(iso);
    this.timeCache.set(iso, text);
    return text;
  }

  private computeTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return d.toLocaleDateString();
  }
}
