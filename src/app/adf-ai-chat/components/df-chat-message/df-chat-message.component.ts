import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import { ChatMessage, ToolCall } from '../../types/chat';
import { DfChatToolResultComponent } from '../df-chat-tool-result/df-chat-tool-result.component';

@Component({
  selector: 'df-chat-message',
  standalone: true,
  // OnPush is safe here: the parent never mutates a ChatMessage in place —
  // messages always arrive as fresh objects from the API poll (or a fresh
  // optimistic object), so the `message` input reference changes whenever
  // content changes. This confines the 1s poll-tick re-render to messages
  // whose input identity actually changed.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule, DfChatToolResultComponent],
  template: `
    <ng-container [ngSwitch]="message.role">
      <!-- Tool result: collapsible card -->
      <df-chat-tool-result
        *ngSwitchCase="'tool'"
        [message]="message"></df-chat-tool-result>

      <!-- User message: right-aligned bubble -->
      <div *ngSwitchCase="'user'" class="msg msg--user">
        <div class="msg__bubble">
          <p>{{ message.content }}</p>
        </div>
      </div>

      <!-- Assistant message: left-aligned bubble -->
      <div *ngSwitchCase="'assistant'" class="msg msg--assistant">
        <div class="msg__avatar">
          <fa-icon [icon]="faRobot"></fa-icon>
        </div>
        <div class="msg__bubble">
          <ng-container *ngIf="message.content">
            <ng-container *ngFor="let seg of segments; trackBy: trackSeg">
              <pre
                *ngIf="seg.type === 'code'"
                class="msg__code"><code>{{ seg.text }}</code></pre>
              <p *ngIf="seg.type === 'text'">{{ seg.text }}</p>
            </ng-container>
          </ng-container>
          <p *ngIf="!message.content" class="msg__empty">(no text response)</p>
          <div *ngIf="hasToolCalls" class="msg__tool-calls">
            <div
              *ngFor="let tc of message.tool_calls; trackBy: trackToolCall"
              class="msg__tool-call">
              <div class="msg__tool-call-head">
                <span class="msg__tool-call-name">{{ tc.name }}</span>
                <span *ngIf="tc.service" class="msg__tool-call-service">{{
                  tc.service
                }}</span>
              </div>
              <pre *ngIf="argsText(tc)" class="msg__tool-call-args">{{
                argsText(tc)
              }}</pre>
            </div>
          </div>
          <div *ngIf="hasUsage" class="msg__usage">
            <span *ngIf="message.input_tokens != null"
              >in {{ message.input_tokens }}t</span
            >
            <span *ngIf="message.output_tokens != null"
              >out {{ message.output_tokens }}t</span
            >
            <span *ngIf="message.latency_ms != null"
              >{{ message.latency_ms }}ms</span
            >
          </div>
        </div>
      </div>

      <!-- Fallback: system / unknown -->
      <div *ngSwitchDefault class="msg msg--system">
        <div class="msg__bubble">
          <p>{{ message.content }}</p>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .msg {
        display: flex;
        gap: 0.75rem;
        max-width: 100%;

        // Departure: bubbles ride the shared corner scale, flat with
        // hairline borders; the user bubble is the solid accent.
        &--user {
          justify-content: flex-end;

          .msg__bubble {
            background: var(--df-accent);
            color: var(--df-accent-contrast);
          }
        }

        &--assistant {
          justify-content: flex-start;
          align-items: flex-start;

          .msg__bubble {
            background: var(--chat-surface-2);
            border: 1px solid var(--chat-border-2);
          }
        }

        &--system {
          justify-content: center;

          .msg__bubble {
            background: var(--chat-hover);
            color: var(--chat-text-muted);
            font-style: italic;
            font-size: 1.3rem;
          }
        }

        &__avatar {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: var(--df-accent-soft);
          color: var(--df-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
        }

        &__bubble {
          padding: 0.75rem 1rem;
          border-radius: var(--df-radius);
          max-width: min(720px, 80%);

          p {
            margin: 0 0 0.5rem;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.5;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }

        &__empty {
          color: var(--chat-text-faint);
          font-style: italic;
          font-size: 1.3rem;
        }

        &__code {
          margin: 0.5rem 0;
          padding: 0.75rem 0.875rem;
          background: var(--chat-code-bg);
          // Hairline on a panel that stays dark in both themes: keep white.
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--df-radius-sm);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          overflow: auto;
          white-space: pre;
          color: var(--df-code-text);

          code {
            font-family: inherit;
            background: transparent;
            padding: 0;
          }
        }

        &__tool-calls {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--chat-border);
          font-size: 13px;
          color: var(--chat-text-2);
        }

        &__tool-call {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        &__tool-call-head {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        &__tool-call-name {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 13px;
        }

        &__tool-call-args {
          margin: 0;
          padding: 0.5rem 0.625rem;
          background: var(--chat-code-bg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--df-radius-sm);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 12px;
          line-height: 1.45;
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--df-code-text);
          overflow: auto;
        }

        &__tool-call-service {
          padding: 0.1rem 0.5rem;
          border-radius: var(--df-radius-sm);
          background: var(--chat-surface-2);
          border: 1px solid var(--chat-border-2);
          font-size: 11px;
        }

        &__usage {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--chat-border-2);
          font-size: 11px;
          color: var(--chat-text-faint);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
        }
      }
    `,
  ],
})
export class DfChatMessageComponent {
  @Input({ required: true }) message!: ChatMessage;

  faRobot = faRobot;
  faUser = faUser;

  get hasToolCalls(): boolean {
    return !!(this.message.tool_calls && this.message.tool_calls.length);
  }

  /** Memo for argsText: JSON parse/stringify per template evaluation (it is
   *  called twice per tool call per CD cycle) is a CD storm during the chat
   *  poll. Keyed on the ToolCall object, revalidated on its `arguments`
   *  reference so a replaced payload recomputes. */
  private argsCache = new WeakMap<
    ToolCall,
    { args: ToolCall['arguments']; text: string }
  >();

  /** Pretty-print a tool call's arguments; empty string when there are none. */
  argsText(tc: ToolCall): string {
    const cached = this.argsCache.get(tc);
    if (cached && cached.args === tc.arguments) {
      return cached.text;
    }
    const text = this.computeArgsText(tc);
    this.argsCache.set(tc, { args: tc.arguments, text });
    return text;
  }

  private computeArgsText(tc: ToolCall): string {
    const a = tc.arguments;
    if (a == null) {
      return '';
    }
    if (typeof a === 'string') {
      const t = a.trim();
      if (!t || t === '{}') {
        return '';
      }
      try {
        return JSON.stringify(JSON.parse(t), null, 2);
      } catch {
        return t;
      }
    }
    if (!Object.keys(a).length) {
      return '';
    }
    return JSON.stringify(a, null, 2);
  }

  trackToolCall(i: number, tc: ToolCall): string | number {
    return tc.id ?? i;
  }

  /** Segments carry no id; index-based tracking keeps existing <p>/<pre>
   *  DOM nodes alive when the memoized array is rebuilt on content growth. */
  trackSeg(i: number): number {
    return i;
  }

  get hasUsage(): boolean {
    return (
      this.message.input_tokens != null ||
      this.message.output_tokens != null ||
      this.message.latency_ms != null
    );
  }

  /** Memo for segments: without it the getter returned a fresh array of
   *  fresh objects per CD cycle, so the default *ngFor differ destroyed and
   *  rebuilt every <p>/<pre> on every tick of the 1s chat poll. Keyed on
   *  message.content, which is the getter's only input. */
  private segCache: {
    content: string;
    segs: Array<{ type: 'text' | 'code'; text: string }>;
  } | null = null;

  /**
   * Split assistant content into text + fenced-code segments. Pure-text
   * binding only — no innerHTML, so there is no XSS surface.
   *
   * ponytail: inline markdown (**bold**, *italic*, `code`) renders as
   * literal asterisks (rollout punch item 3). Verified there is no
   * markdown pipeline anywhere in this repo or its history to wire up;
   * fixing it means adding a sanctioned renderer + sanitizer dependency
   * (e.g. marked + DOMPurify), which is an integration-level decision.
   */
  get segments(): Array<{ type: 'text' | 'code'; text: string }> {
    const content = this.message.content ?? '';
    if (this.segCache?.content !== content) {
      this.segCache = { content, segs: this.computeSegments(content) };
    }
    return this.segCache.segs;
  }

  private computeSegments(
    c: string
  ): Array<{ type: 'text' | 'code'; text: string }> {
    if (!c) {
      return [];
    }
    const out: Array<{ type: 'text' | 'code'; text: string }> = [];
    const re = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(c))) {
      if (m.index > last) {
        const text = c.slice(last, m.index);
        if (text.trim()) {
          out.push({ type: 'text', text });
        }
      }
      out.push({ type: 'code', text: m[1] });
      last = m.index + m[0].length;
    }
    if (last < c.length) {
      const text = c.slice(last);
      if (text.trim()) {
        out.push({ type: 'text', text });
      }
    }
    if (out.length === 0) {
      out.push({ type: 'text', text: c });
    }
    return out;
  }
}
