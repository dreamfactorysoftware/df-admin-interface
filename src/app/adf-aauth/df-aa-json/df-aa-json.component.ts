import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { DfAaCopyComponent } from '../df-aa-copy/df-aa-copy.component';
import { JsonToken, prettyBody, prettyJson, tokenizeJson } from '../jwt-view';

/**
 * Small read-only code viewer: pretty JSON coloured by token kind (spans,
 * no innerHTML), or plain text when the value is not JSON. A copy button
 * sits in the corner.
 */
@Component({
  selector: 'df-aa-json',
  standalone: true,
  imports: [NgFor, NgIf, DfAaCopyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code">
      <pre
        [attr.aria-label]="
          label || null
        "><code><ng-container *ngIf="json; else plain"><span *ngFor="let t of tokens" [class]="'j-' + t.kind">{{ t.text }}</span></ng-container><ng-template #plain>{{ text }}</ng-template></code></pre>
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
        font-family: var(--df-font-mono);
        font-size: var(--df-font-size-xs);
        line-height: 1.55;
        margin: 0;
        max-height: 420px;
        overflow: auto;
        padding: var(--df-space-3) var(--df-space-8) var(--df-space-3)
          var(--df-space-3);
        white-space: pre-wrap;
        word-break: break-word;
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
export class DfAaJsonComponent implements OnChanges {
  /** A value to pretty-print, or a raw string body (JSON if it parses). */
  @Input() value: unknown;
  @Input() label = '';
  @Input() testId = 'aa-json-copy';

  json = false;
  text = '';
  tokens: JsonToken[] = [];

  ngOnChanges(): void {
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
}
