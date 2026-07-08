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

/** A date-bucketed run of sessions for one sidebar group heading. */
interface SessionGroup {
  key: string;
  label: string;
  sessions: ChatSession[];
}

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

      <div
        *ngIf="!loading && sessions.length > 0"
        class="session-list__scroll">
        <section
          *ngFor="let g of groups; trackBy: trackGroup"
          class="session-list__group">
          <h3 class="session-list__group-label df-eyebrow">{{ g.label }}</h3>
          <ul class="session-list__items">
            <li
              *ngFor="let s of g.sessions; trackBy: trackById"
              class="session-list__item"
              [class.session-list__item--active]="s.id === activeId">
              <button
                type="button"
                class="session-list__item-button"
                (click)="select.emit(s)">
                <span class="session-list__title">{{ titleFor(s) }}</span>
                <span class="session-list__meta df-numeric">
                  <span>{{ relativeTime(s.updated_at) }}</span>
                  <ng-container *ngIf="tokenCount(s) as tok">
                    <span class="session-list__dot">·</span>
                    <span>{{ tok }} tokens</span>
                  </ng-container>
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
        </section>
      </div>
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

        &__scroll {
          flex: 1;
          overflow-y: auto;
        }

        &__group {
          &:not(:first-child) {
            margin-top: 0.5rem;
          }
        }

        &__group-label {
          position: sticky;
          top: 0;
          z-index: 1;
          margin: 0;
          padding: 0.5rem 0.875rem 0.375rem;
          background: var(--chat-surface);
          color: var(--chat-text-muted);
        }

        &__items {
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

        // Punch item 4: long titles clip to a single ellipsized line.
        &__title {
          font-weight: 500;
          font-size: 1.3rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        &__meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 1.1rem;
          color: var(--chat-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        &__dot {
          color: var(--chat-text-faint);
        }

        &__delete {
          background: none;
          border: none;
          color: var(--chat-text-faint);
          cursor: pointer;
          padding: 0.5rem 0.875rem;
          font-size: 1.3rem;

          &:hover {
            color: var(--df-danger);
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

  trackGroup(_: number, g: SessionGroup): string {
    return g.key;
  }

  /** Session title. The backend auto-titles from the first user message, so
   *  the title itself is the content preview; fall back to a stable label for
   *  never-used sessions. We never invent a snippet the list endpoint does
   *  not return. */
  titleFor(s: ChatSession): string {
    const t = (s.title ?? '').trim();
    return t || `Session ${s.id}`;
  }

  /** Combined token count for the row meta; empty string when there is none
   *  (so the chip is omitted rather than reading a fake "0"). */
  tokenCount(s: ChatSession): string {
    const total = (s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0);
    return total > 0 ? total.toLocaleString('en-US') : '';
  }

  /** Memo for group derivation: rebuilding the buckets per CD cycle (the
   *  chat poll ticks every second) is wasted work. Keyed on the sessions
   *  array reference — the parent always reassigns it on change — plus the
   *  calendar day so the Today/Yesterday split stays fresh past midnight. */
  private groupCache: { ref: ChatSession[]; day: string; groups: SessionGroup[] } | null =
    null;

  get groups(): SessionGroup[] {
    const day = new Date().toDateString();
    if (this.groupCache?.ref === this.sessions && this.groupCache.day === day) {
      return this.groupCache.groups;
    }
    const groups = this.buildGroups(this.sessions);
    this.groupCache = { ref: this.sessions, day, groups };
    return groups;
  }

  private buildGroups(sessions: ChatSession[]): SessionGroup[] {
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const earlier: ChatSession[] = [];

    const now = new Date();
    const startToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const startYesterday = startToday - 86400000;

    for (const s of sessions) {
      const ts = this.timestamp(s.updated_at ?? s.created_at);
      if (ts >= startToday) {
        today.push(s);
      } else if (ts >= startYesterday) {
        yesterday.push(s);
      } else {
        earlier.push(s);
      }
    }

    const out: SessionGroup[] = [];
    if (today.length) {
      out.push({ key: 'today', label: 'Today', sessions: today });
    }
    if (yesterday.length) {
      out.push({ key: 'yesterday', label: 'Yesterday', sessions: yesterday });
    }
    if (earlier.length) {
      out.push({ key: 'earlier', label: 'Earlier', sessions: earlier });
    }
    return out;
  }

  private timestamp(iso?: string): number {
    if (!iso) {
      return 0;
    }
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? 0 : t;
  }

  /** Memo for relativeTime: runs per row per CD cycle; the wording only
   *  changes as time passes, so cache per ISO string and drop the whole
   *  cache when the minute rolls over. */
  private relCache = new Map<string, string>();
  private relCacheMinute = -1;

  relativeTime(iso?: string): string {
    if (!iso) {
      return '';
    }
    const minute = Math.floor(Date.now() / 60000);
    if (minute !== this.relCacheMinute) {
      this.relCacheMinute = minute;
      this.relCache.clear();
    }
    const hit = this.relCache.get(iso);
    if (hit !== undefined) {
      return hit;
    }
    const text = this.computeRelative(iso);
    this.relCache.set(iso, text);
    return text;
  }

  private computeRelative(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) {
      return '';
    }
    const diff = Date.now() - then;
    if (diff < 60000) {
      return 'just now';
    }
    const mins = Math.floor(diff / 60000);
    if (mins < 60) {
      return `${mins}m ago`;
    }
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }
    return new Date(then).toLocaleDateString();
  }
}
