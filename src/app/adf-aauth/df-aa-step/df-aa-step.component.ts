import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  BadgeVariant,
  DfBadgeComponent,
} from 'src/app/shared/components/df-badge/df-badge.component';
import { relTime } from 'src/app/adf-data-masking/dm-time';
import { HeaderPair, PlaygroundStep } from '../aauth.types';
import { DfAaCopyComponent } from '../df-aa-copy/df-aa-copy.component';
import { DfAaJsonComponent } from '../df-aa-json/df-aa-json.component';
import {
  DecodedJwt,
  decodeJwt,
  isProtocolHeader,
  pathOf,
  statusVariant,
} from '../jwt-view';

/**
 * One row of the Try it timeline: kind, request line and status; expands
 * to the request and response (headers, body) and the decoded tokens.
 */
@Component({
  selector: 'df-aa-step',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatIconModule,
    TranslocoPipe,
    DfBadgeComponent,
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
  @Output() toggled = new EventEmitter<void>();

  tokens: DecodedJwt[] = [];
  line = '';
  status: number | null = null;
  variant: BadgeVariant = 'neutral';

  ngOnChanges(): void {
    const s = this.step;
    this.tokens = (s.tokens ?? []).map(decodeJwt);
    this.line = s.request
      ? `${s.request.method} ${pathOf(s.request.url)}`
      : s.title;
    this.status = s.response?.status ?? null;
    this.variant = statusVariant(this.status);
  }

  get hasDetail(): boolean {
    return !!(this.step.request || this.step.response || this.tokens.length);
  }

  protocol(h: HeaderPair): boolean {
    return isProtocolHeader(h[0]);
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
}
