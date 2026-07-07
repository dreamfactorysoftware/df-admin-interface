import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ChatSession } from '../../types/chat';

@Component({
  selector: 'df-chat-session-list',
  standalone: true,
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
        }

        &__empty {
          padding: 1rem 1rem 0;
          color: var(--chat-text-muted);
          font-style: italic;
          font-size: 14px;
        }

        &__items {
          flex: 1;
          overflow-y: auto;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        &__item {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid var(--chat-border-2);

          &--active {
            background: rgba(96, 165, 250, 0.08);
            box-shadow: inset 3px 0 0 #60a5fa;
          }

          &:hover:not(.session-list__item--active) {
            background: var(--chat-hover);
          }
        }

        &__item-button {
          flex: 1;
          background: none;
          border: none;
          color: inherit;
          text-align: left;
          padding: 0.625rem 1rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-family: inherit;
          font-size: inherit;
        }

        &__title {
          font-weight: 500;
          font-size: 0.9375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &__meta {
          font-size: 12px;
          color: var(--chat-text-muted);
        }

        &__delete {
          background: none;
          border: none;
          color: var(--chat-text-faint);
          cursor: pointer;
          padding: 0.5rem 0.875rem;
          font-size: 14px;

          &:hover {
            color: #ff6b6b;
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

  formatTime(iso?: string): string {
    if (!iso) {
      return '';
    }
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
