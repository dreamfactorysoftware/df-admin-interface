import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  BadgeVariant,
  DfBadgeComponent,
} from 'src/app/shared/components/df-badge/df-badge.component';
import { relTime } from 'src/app/adf-data-masking/dm-time';
import { HeaderPair, PlaygroundStep } from '../aauth.types';
import { DfAaAgentMarkComponent } from '../df-aa-agent-mark/df-aa-agent-mark.component';
import { DfAaCopyComponent } from '../df-aa-copy/df-aa-copy.component';
import { DfAaJsonComponent } from '../df-aa-json/df-aa-json.component';
import {
  DecodedJwt,
  decodeJwt,
  isProtocolHeader,
  jwtsIn,
  pathOf,
  statusVariant,
} from '../jwt-view';

/** Header values longer than this clamp to three lines until opened. */
export const LONG_HEADER = 160;

export interface HeaderRow {
  name: string;
  value: string;
  proto: boolean;
  long: boolean;
  /** A JWT inside the value (Signature-Key, AAuth-Requirement), decoded. */
  token: DecodedJwt | null;
}

export function headerRows(
  headers: HeaderPair[] | null | undefined
): HeaderRow[] {
  return (headers ?? []).map(([name, value]) => ({
    name,
    value,
    proto: isProtocolHeader(name),
    long: (value ?? '').length > LONG_HEADER,
    token: jwtsIn(value)[0] ?? null,
  }));
}

/**
 * One row of the Try it diagram: number, kind, request line and status;
 * expands to the request and response (headers, body) and the decoded
 * tokens. Long header values clamp, and a JWT inside a header decodes in
 * place.
 */
@Component({
  selector: 'df-aa-step',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgTemplateOutlet,
    MatIconModule,
    MatTooltipModule,
    TranslocoPipe,
    DfBadgeComponent,
    DfAaAgentMarkComponent,
    DfAaCopyComponent,
    DfAaJsonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './df-aa-step.component.html',
  styleUrls: ['./df-aa-step.component.scss'],
})
export class DfAaStepComponent implements OnChanges {
  @Input({ required: true }) step!: PlaygroundStep;
  @Input() index = 0;
  @Input() expanded = false;
  /** The run's Response card already shows this step's body: skip it here. */
  @Input() bodyBelow = false;
  @Output() toggled = new EventEmitter<void>();

  tokens: DecodedJwt[] = [];
  requestHeaders: HeaderRow[] = [];
  responseHeaders: HeaderRow[] = [];
  line = '';
  status: number | null = null;
  variant: BadgeVariant = 'neutral';

  /**
   * Opened header values and header tokens, by side + row. Kept across
   * input changes: polling hands in a fresh step object every 2 s.
   */
  private opened = new Set<string>();

  ngOnChanges(): void {
    const s = this.step;
    this.tokens = (s.tokens ?? []).map(decodeJwt);
    this.requestHeaders = headerRows(s.request?.headers);
    this.responseHeaders = headerRows(s.response?.headers);
    this.line = s.request
      ? `${s.request.method} ${pathOf(s.request.url)}`
      : s.title;
    this.status = s.response?.status ?? null;
    this.variant = statusVariant(this.status);
  }

  get hasDetail(): boolean {
    return !!(this.step.request || this.step.response || this.tokens.length);
  }

  isOpen(key: string): boolean {
    return this.opened.has(key);
  }

  toggle(key: string): void {
    if (!this.opened.delete(key)) this.opened.add(key);
  }

  expiry(t: DecodedJwt): { key: string; when: string } | null {
    if (!t.expMs) return null;
    const iso = new Date(t.expMs).toISOString();
    return {
      key: t.expMs < Date.now() ? 'aauth.try.expired' : 'aauth.try.expires',
      when: relTime(iso),
    };
  }

  trackHeader = (i: number) => i;
  trackToken = (i: number, t: DecodedJwt) => `${i}:${t.raw}`;
}
