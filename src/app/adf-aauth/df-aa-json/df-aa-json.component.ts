import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { DfAaCopyComponent } from '../df-aa-copy/df-aa-copy.component';
import { JsonToken, prettyBody, prettyJson, tokenizeJson } from '../jwt-view';

/**
 * Small read-only code viewer: pretty JSON coloured by token kind (spans,
 * no innerHTML), or plain text when the value is not JSON. A copy button
 * sits in the corner. Long lines scroll sideways (the block is a focusable
 * region, so keys scroll it too) and fade at the edge that has more;
 * `wrap` breaks them instead, for opaque values such as decoded JWT claims.
 */
@Component({
  selector: 'df-aa-json',
  standalone: true,
  imports: [NgFor, NgIf, DfAaCopyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code">
      <pre
        #pre
        tabindex="0"
        role="region"
        [attr.aria-label]="
          label || null
        "><code><ng-container *ngIf="json; else plain"><span *ngFor="let t of tokens; trackBy: trackToken" [class]="'j-' + t.kind">{{ t.text }}</span></ng-container><ng-template #plain>{{ text }}</ng-template></code></pre>
      <df-aa-copy class="copy" [text]="text" [testId]="testId"></df-aa-copy>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .code {
        background: var(--df-code-bg);
        border-radius: var(--df-radius-sm);
        color: var(--df-code-text);
        position: relative;
      }
      pre {
        border-radius: inherit;
        font-family: var(--df-font-mono);
        font-size: var(--df-font-size-xs);
        line-height: 1.55;
        margin: 0;
        max-height: 420px;
        outline: none;
        overflow: auto;
        padding: var(--df-space-3) var(--df-space-8) var(--df-space-3)
          var(--df-space-3);
        /* Code keeps its lines (no breaks inside a value); it scrolls. */
        white-space: pre;
      }
      pre:focus-visible {
        box-shadow: var(--df-focus-ring);
      }
      /* More to the right (or left): that edge fades out. */
      :host(.more-end) pre {
        -webkit-mask-image: linear-gradient(
          to right,
          #000 calc(100% - 40px),
          transparent
        );
        mask-image: linear-gradient(
          to right,
          #000 calc(100% - 40px),
          transparent
        );
      }
      :host(.more-start) pre {
        -webkit-mask-image: linear-gradient(
          to left,
          #000 calc(100% - 24px),
          transparent
        );
        mask-image: linear-gradient(
          to left,
          #000 calc(100% - 24px),
          transparent
        );
      }
      :host(.more-start.more-end) pre {
        -webkit-mask-image: linear-gradient(
          to right,
          transparent,
          #000 24px,
          #000 calc(100% - 40px),
          transparent
        );
        mask-image: linear-gradient(
          to right,
          transparent,
          #000 24px,
          #000 calc(100% - 40px),
          transparent
        );
      }
      :host(.wrap) pre {
        overflow-wrap: anywhere;
        white-space: pre-wrap;
      }
      .copy {
        color: var(--df-code-text);
        position: absolute;
        right: 4px;
        top: 4px;
      }
      .j-key {
        color: var(--df-json-key);
      }
      .j-string {
        color: var(--df-json-string);
      }
      .j-number {
        color: var(--df-json-number);
      }
      .j-literal {
        color: var(--df-json-literal);
      }
      .j-punct {
        color: var(--df-json-punct);
      }
    `,
  ],
})
export class DfAaJsonComponent
  implements OnChanges, AfterViewInit, AfterViewChecked, OnDestroy
{
  /** A value to pretty-print, or a raw string body (JSON if it parses). */
  @Input() value: unknown;
  /** Names the scrollable block for screen readers. */
  @Input() label = '';
  @Input() testId = 'aa-json-copy';
  /** Break long lines instead of scrolling them. */
  @HostBinding('class.wrap') @Input() wrap = false;

  @ViewChild('pre') private pre?: ElementRef<HTMLElement>;
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private readonly zone = inject(NgZone);
  private readonly onScroll = () => this.edges();
  private moreStart = false;
  private moreEnd = false;

  json = false;
  text = '';
  tokens: JsonToken[] = [];
  /** Same body as last time (polling re-sends it): keep the spans. */
  private last: { value: unknown } | null = null;

  ngOnChanges(): void {
    if (this.last && this.last.value === this.value) return;
    this.last = { value: this.value };
    if (typeof this.value === 'string' || this.value == null) {
      const p = prettyBody(this.value as string | null);
      this.json = p.json;
      this.text = p.text;
    } else {
      this.json = true;
      this.text = prettyJson(this.value);
    }
    this.tokens = this.json ? tokenizeJson(this.text) : [];
  }

  ngAfterViewInit(): void {
    // Scrolling only moves the fades: no change detection for it.
    this.zone.runOutsideAngular(() =>
      this.pre?.nativeElement.addEventListener('scroll', this.onScroll, {
        passive: true,
      })
    );
  }

  ngAfterViewChecked(): void {
    this.edges();
  }

  ngOnDestroy(): void {
    this.pre?.nativeElement.removeEventListener('scroll', this.onScroll);
  }

  /**
   * Which edges hide content: classes on the host, set directly (they are
   * measured after the view settles, and a scroll needs no change detection).
   */
  @HostListener('window:resize')
  edges(): void {
    const el = this.pre?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const start = !this.wrap && el.scrollLeft > 1;
    const end = !this.wrap && max - el.scrollLeft > 1;
    if (start === this.moreStart && end === this.moreEnd) return;
    this.moreStart = start;
    this.moreEnd = end;
    this.host.classList.toggle('more-start', start);
    this.host.classList.toggle('more-end', end);
  }

  trackToken = (i: number) => i;
}
