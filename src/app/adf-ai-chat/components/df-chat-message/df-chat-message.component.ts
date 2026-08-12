import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faRobot,
  faUser,
  faCopy,
  faCheck,
  faRotateRight,
  faCode,
} from '@fortawesome/free-solid-svg-icons';
import { ChatMessage, ToolCall } from '../../types/chat';
import { DfChatToolResultComponent } from '../df-chat-tool-result/df-chat-tool-result.component';
import { estimateCost, formatUSD } from 'src/app/adf-ai-usage/utils/cost';
import { ProviderRates } from 'src/app/adf-ai-usage/types/usage';

/** One rendered piece of inline markdown inside a text segment. */
interface InlineToken {
  kind: 'text' | 'bold' | 'italic' | 'code' | 'link';
  text: string;
  href?: string;
}

/** Suggested-follow-up chips parsed from a trailing suggestions fence. */
const MAX_SUGGESTIONS = 4;
/** Defensive per-chip length cap: longer lines are dropped, not truncated. */
const MAX_SUGGESTION_CHARS = 120;
/** Stray leading bullet/number tolerated on a suggestion line. */
const SUGGESTION_BULLET_RE = /^(?:[-*•]|\d{1,2}[.)])\s+(.+)$/;

/** Parsed view of one assistant message's content. */
interface ParsedContent {
  content: string;
  segs: Array<{ type: 'text' | 'code'; text: string }>;
  suggestions: string[];
}

@Component({
  selector: 'df-chat-message',
  standalone: true,
  // OnPush is safe here: the parent never mutates a ChatMessage in place —
  // messages always arrive as fresh objects from the API poll (or a fresh
  // optimistic object), so the `message` input reference changes whenever
  // content changes. Local view state (showRaw, copied) flips only from this
  // component's own handlers, which mark it dirty under OnPush.
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
          <!-- Raw view: verbatim content, markdown literal -->
          <pre *ngIf="showRaw" class="msg__raw">{{ message.content }}</pre>

          <ng-container *ngIf="!showRaw && message.content">
            <ng-container *ngFor="let seg of segments; trackBy: trackSeg">
              <pre
                *ngIf="seg.type === 'code'"
                class="msg__code"><code>{{ seg.text }}</code></pre>
              <p *ngIf="seg.type === 'text'">
                <ng-container
                  *ngFor="let tok of inlineTokens(seg.text); trackBy: trackTok"
                  ><ng-container [ngSwitch]="tok.kind"
                    ><strong *ngSwitchCase="'bold'">{{ tok.text }}</strong
                    ><em *ngSwitchCase="'italic'">{{ tok.text }}</em
                    ><code *ngSwitchCase="'code'" class="msg__inline-code">{{
                      tok.text
                    }}</code
                    ><a
                      *ngSwitchCase="'link'"
                      [href]="tok.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ tok.text }}</a
                    ><span *ngSwitchDefault>{{ tok.text }}</span></ng-container
                  ></ng-container
                >
              </p>
            </ng-container>
          </ng-container>
          <p *ngIf="!showRaw && !message.content" class="msg__empty">
            (no text response)
          </p>

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

          <!-- Metering chip row: tokens + cost + latency, from the same
               usage record adf-ai-usage reads. Cost is derived from the
               connection's provider rate; omitted when no rate resolves. -->
          <div *ngIf="hasUsage" class="msg__meter df-numeric">
            <span *ngIf="message.input_tokens != null" class="msg__chip">
              <span class="msg__chip-label">in</span
              >{{ fmtNum(message.input_tokens) }}
            </span>
            <span *ngIf="message.output_tokens != null" class="msg__chip">
              <span class="msg__chip-label">out</span
              >{{ fmtNum(message.output_tokens) }}
            </span>
            <span
              *ngIf="costText"
              class="msg__chip msg__chip--cost"
              [title]="costTitle">
              {{ costText }}
            </span>
            <span *ngIf="message.latency_ms != null" class="msg__chip">
              {{ fmtLatency(message.latency_ms) }}
            </span>
          </div>

          <!-- Suggested follow-ups: parsed from a trailing suggestions fence
               in the assistant content. The parent gates visibility to the
               newest assistant message while no reply is in flight; clicking
               a chip sends its text through the normal send flow. -->
          <div
            *ngIf="showSuggestions && !showRaw && suggestions.length"
            class="msg__suggestions"
            role="group"
            aria-label="Suggested follow-ups">
            <button
              *ngFor="let s of suggestions; trackBy: trackSuggestion"
              type="button"
              class="msg__suggestion"
              [title]="s"
              (click)="suggestionSelected.emit(s)">
              {{ s }}
            </button>
          </div>

          <!-- Hover actions -->
          <div class="msg__actions">
            <button
              type="button"
              class="msg__action"
              [title]="copied ? 'Copied' : 'Copy'"
              (click)="copy()">
              <fa-icon [icon]="copied ? faCheck : faCopy"></fa-icon>
            </button>
            <button
              type="button"
              class="msg__action"
              title="Regenerate"
              (click)="regenerate.emit(message)">
              <fa-icon [icon]="faRotateRight"></fa-icon>
            </button>
            <button
              type="button"
              class="msg__action"
              [class.msg__action--on]="showRaw"
              [title]="showRaw ? 'Show formatted' : 'View raw'"
              (click)="showRaw = !showRaw">
              <fa-icon [icon]="faCode"></fa-icon>
            </button>
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

          // Hover actions surface only over the assistant bubble.
          &:hover .msg__actions,
          .msg__bubble:focus-within .msg__actions {
            opacity: 1;
            pointer-events: auto;
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
          position: relative;
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

          strong {
            font-weight: 600;
          }

          a {
            color: var(--df-accent);
            text-decoration: underline;
          }
        }

        &__empty {
          color: var(--chat-text-faint);
          font-style: italic;
          font-size: 1.3rem;
        }

        &__raw {
          margin: 0;
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--df-code-text);
        }

        &__inline-code {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 0.92em;
          padding: 0.1rem 0.35rem;
          border-radius: var(--df-radius-sm);
          background: var(--chat-code-bg);
          color: var(--df-code-text);
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

        // Metering chips: tabular, quiet, one line. df-numeric on the row.
        &__meter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--chat-border-2);
        }

        &__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.1rem 0.45rem;
          border-radius: var(--df-radius-sm);
          background: var(--chat-hover);
          border: 1px solid var(--chat-border-2);
          font-size: 11px;
          line-height: 1.6;
          color: var(--chat-text-2);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;

          &--cost {
            color: var(--df-text);
            border-color: var(--df-accent-border, var(--chat-border-2));
          }
        }

        &__chip-label {
          color: var(--chat-text-faint);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 10px;
        }

        // Suggested follow-ups: real buttons (keyboard-focusable), styled as
        // accent-tinted pills so they read as actions, not metering chips.
        // Theme tokens keep them correct in dark mode for free.
        &__suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed var(--chat-border-2);
        }

        &__suggestion {
          max-width: 100%;
          padding: 0.25rem 0.75rem;
          border: 1px solid var(--df-accent-border, var(--chat-border-2));
          border-radius: 999px;
          background: var(--df-accent-soft);
          color: var(--df-accent);
          font: inherit;
          font-size: 1.2rem;
          line-height: 1.5;
          text-align: left;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
          transition:
            background 120ms ease,
            color 120ms ease;

          &:hover {
            background: var(--df-accent);
            color: var(--df-accent-contrast);
          }

          &:focus-visible {
            outline: none;
            box-shadow: var(--df-focus-ring);
          }
        }

        &__actions {
          position: absolute;
          top: -0.75rem;
          right: 0.5rem;
          display: flex;
          gap: 0.125rem;
          padding: 0.125rem;
          border-radius: var(--df-radius-sm);
          background: var(--chat-surface);
          border: 1px solid var(--chat-border-2);
          box-shadow: var(--df-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.2));
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.12s ease;
        }

        &__action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background: none;
          border: none;
          border-radius: var(--df-radius-sm);
          color: var(--chat-text-muted);
          cursor: pointer;
          font-size: 1.2rem;

          &:hover {
            background: var(--chat-hover);
            color: var(--df-text);
          }

          &--on {
            color: var(--df-accent);
          }
        }
      }
    `,
  ],
})
export class DfChatMessageComponent {
  @Input({ required: true }) message!: ChatMessage;
  /** Provider rate used to derive per-message cost. Null = no cost chip. */
  @Input() rate: ProviderRates | null = null;
  /** Model label, shown in the cost chip tooltip so the estimate is honest. */
  @Input() model?: string;
  /** Suggestion chips render only on the newest assistant message while no
   *  reply is in flight — both facts live in the parent, so it gates here. */
  @Input() showSuggestions = false;

  @Output() regenerate = new EventEmitter<ChatMessage>();
  /** A suggestion chip was clicked; its text becomes the next user message. */
  @Output() suggestionSelected = new EventEmitter<string>();

  private cdr = inject(ChangeDetectorRef);

  faRobot = faRobot;
  faUser = faUser;
  faCopy = faCopy;
  faCheck = faCheck;
  faRotateRight = faRotateRight;
  faCode = faCode;

  showRaw = false;
  copied = false;

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

  trackTok(i: number): number {
    return i;
  }

  get hasUsage(): boolean {
    return (
      this.message.input_tokens != null ||
      this.message.output_tokens != null ||
      this.message.latency_ms != null
    );
  }

  /** Derived per-message cost, using the same estimator + rate the usage
   *  dashboard uses. Null (chip omitted) when no rate resolved or there are
   *  no token counts to price. Never a fabricated figure. */
  get costText(): string | null {
    if (!this.rate) {
      return null;
    }
    const inTok = this.message.input_tokens;
    const outTok = this.message.output_tokens;
    if (inTok == null && outTok == null) {
      return null;
    }
    return formatUSD(estimateCost(inTok ?? 0, outTok ?? 0, this.rate));
  }

  get costTitle(): string {
    const provider = this.model || this.rate?.provider || 'provider';
    return `Estimated from ${provider} rates`;
  }

  fmtNum(n: number | null | undefined): string {
    return (n ?? 0).toLocaleString('en-US');
  }

  fmtLatency(ms: number | null | undefined): string {
    if (ms == null) {
      return '';
    }
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s`;
    }
    return `${ms}ms`;
  }

  copy(): void {
    const text = this.message.content ?? '';
    const done = () => {
      this.copied = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => {
        /* clipboard denied: no-op */
      });
    }
  }

  /** Memo for segments + suggestions: without it the getter returned a fresh
   *  array of fresh objects per CD cycle, so the default *ngFor differ
   *  destroyed and rebuilt every <p>/<pre> on every tick of the 1s chat poll.
   *  Keyed on message.content, which is the getters' only input. */
  private segCache: ParsedContent | null = null;

  /**
   * Split assistant content into text + fenced-code segments. Pure-text
   * binding only — no innerHTML, so there is no XSS surface. Inline markdown
   * inside each text segment is rendered structurally by inlineTokens().
   */
  get segments(): Array<{ type: 'text' | 'code'; text: string }> {
    return this.parsed.segs;
  }

  /** Chip labels from a trailing suggestions fence; empty when there is none.
   *  Rendering is further gated by the showSuggestions input. */
  get suggestions(): string[] {
    return this.parsed.suggestions;
  }

  private get parsed(): ParsedContent {
    const content = this.message.content ?? '';
    if (this.segCache?.content !== content) {
      this.segCache = { content, ...this.computeSegments(content) };
    }
    return this.segCache;
  }

  private computeSegments(c: string): {
    segs: Array<{ type: 'text' | 'code'; text: string }>;
    suggestions: string[];
  } {
    if (!c) {
      return { segs: [], suggestions: [] };
    }
    const out: Array<{ type: 'text' | 'code'; text: string }> = [];
    let suggestions: string[] = [];
    const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(c))) {
      if (m.index > last) {
        const text = c.slice(last, m.index);
        if (text.trim()) {
          out.push({ type: 'text', text });
        }
      }
      // A CLOSED trailing ```suggestions fence carries follow-up chips: strip
      // it from the rendered segments and surface its lines instead. Only the
      // trailing fence qualifies — a mid-message suggestions fence (e.g. the
      // assistant quoting its own format) stays visible as ordinary code, as
      // does a trailing fence whose lines all fail validation. An UNCLOSED
      // fence never matches this regex and renders as literal text.
      const end = m.index + m[0].length;
      const lines =
        m[1] === 'suggestions' && !c.slice(end).trim()
          ? this.parseSuggestionLines(m[2])
          : [];
      if (lines.length) {
        suggestions = lines;
      } else {
        out.push({ type: 'code', text: m[2] });
      }
      last = end;
    }
    if (last < c.length) {
      const text = c.slice(last);
      if (text.trim()) {
        out.push({ type: 'text', text });
      }
    }
    if (out.length === 0 && suggestions.length === 0) {
      out.push({ type: 'text', text: c });
    }
    return { segs: out, suggestions };
  }

  /** Trimmed, deduped, non-empty lines of a suggestions fence — tolerating
   *  stray bullets/numbers/quotes the model may add — capped defensively at
   *  MAX_SUGGESTIONS chips of MAX_SUGGESTION_CHARS each. */
  private parseSuggestionLines(inner: string): string[] {
    const out: string[] = [];
    for (const raw of inner.split(/\r?\n/)) {
      let line = raw.trim();
      const b = SUGGESTION_BULLET_RE.exec(line);
      if (b) {
        line = b[1].trim();
      }
      line = line.replace(/^["'`]+|["'`]+$/g, '').trim();
      if (line && line.length <= MAX_SUGGESTION_CHARS && !out.includes(line)) {
        out.push(line);
        if (out.length === MAX_SUGGESTIONS) {
          break;
        }
      }
    }
    return out;
  }

  trackSuggestion(i: number): number {
    return i;
  }

  /** Memo for inline tokens: keyed by the raw segment string. Cleared when
   *  the source content changes so it cannot grow unbounded across a
   *  streaming response. */
  private inlineCache = new Map<string, InlineToken[]>();
  private inlineCacheFor = '';

  /**
   * Render inline markdown (bold, italic, inline code, links) as structural
   * tokens. Fixes rollout punch item 3: assistant bubbles previously showed
   * literal ** and * because content was bound as plain text. This tokenizes
   * without innerHTML — every token renders through Angular's text/attr
   * bindings, so there is no HTML-injection surface (link href is bound and
   * sanitized by Angular, which blocks javascript: URLs).
   */
  inlineTokens(text: string): InlineToken[] {
    const content = this.message.content ?? '';
    if (this.inlineCacheFor !== content) {
      this.inlineCacheFor = content;
      this.inlineCache.clear();
    }
    const hit = this.inlineCache.get(text);
    if (hit) {
      return hit;
    }
    const toks = this.parseInline(text);
    this.inlineCache.set(text, toks);
    return toks;
  }

  private parseInline(s: string): InlineToken[] {
    const out: InlineToken[] = [];
    // Order matters: inline code first (protects its literal contents),
    // then bold, then italic, then links. No nesting — flat tokens are
    // enough to kill the literal-asterisk artifact.
    const re =
      /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)|(\[[^\]\n]+\]\([^)\s]+\))/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m.index > last) {
        out.push({ kind: 'text', text: s.slice(last, m.index) });
      }
      const g = m[0];
      if (m[1]) {
        out.push({ kind: 'code', text: g.slice(1, -1) });
      } else if (m[2]) {
        out.push({ kind: 'bold', text: g.slice(2, -2) });
      } else if (m[3]) {
        out.push({ kind: 'italic', text: g.slice(1, -1) });
      } else if (m[4]) {
        const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(g);
        if (mm) {
          out.push({ kind: 'link', text: mm[1], href: mm[2] });
        } else {
          out.push({ kind: 'text', text: g });
        }
      }
      last = m.index + g.length;
    }
    if (last < s.length) {
      out.push({ kind: 'text', text: s.slice(last) });
    }
    if (out.length === 0) {
      out.push({ kind: 'text', text: s });
    }
    return out;
  }
}
