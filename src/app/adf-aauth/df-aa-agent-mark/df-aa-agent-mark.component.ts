import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
} from '@angular/core';
import { NgIf } from '@angular/common';

/** The id the built-in Playground agent signs with: aauth:playground@<issuer host>. */
export const PLAYGROUND_LOCAL_ID = 'aauth:playground';

function hostnameOf(url: string | null | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * True for this DreamFactory's own Playground agent: its id is
 * aauth:playground@<host of this DreamFactory's AAuth issuer>. The same
 * local id from any other provider is just another agent.
 */
export function isPlaygroundAgent(
  agentId: string | null | undefined,
  issuer: string | null | undefined
): boolean {
  const host = hostnameOf(issuer);
  return (
    !!host &&
    (agentId ?? '').trim().toLowerCase() === `${PLAYGROUND_LOCAL_ID}@${host}`
  );
}

/** First letter or digit of the name, else of the agent id without "aauth:". */
export function agentInitial(
  name: string | null | undefined,
  agentId: string | null | undefined
): string {
  const local = (agentId ?? '').replace(/^aauth:/i, '');
  for (const source of [name ?? '', local]) {
    const m = source.match(/[\p{L}\p{N}]/u);
    if (m) return m[0].toLocaleUpperCase();
  }
  return '';
}

/**
 * An agent's tile. DreamFactory's own Playground agent carries the
 * DreamFactory mark (the gear with the database inside, as in the wordmark
 * and favicon; never df-cog.svg, which is the platform's loading spinner);
 * every other agent gets a neutral monogram. Never an
 * agent-supplied logo (impersonation and tracking risk). Decorative: the
 * agent's name always sits beside it. Person Servers use the same tile
 * (`self` for this DreamFactory) so every party reads the same way.
 */
@Component({
  selector: 'df-aa-agent-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf],
  template: `<img
      *ngIf="playground; else monogram"
      class="gear"
      src="assets/img/df-mark.svg"
      alt=""
      data-testid="aa-agent-mark-gear" /><ng-template #monogram>{{
      initial
    }}</ng-template>`,
  styles: [
    `
      :host {
        align-items: center;
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        border-radius: var(--df-radius-sm);
        box-sizing: border-box;
        color: var(--df-text-2);
        display: inline-flex;
        flex: none;
        font-size: 12px;
        font-weight: var(--df-font-weight-heading);
        height: 24px;
        justify-content: center;
        line-height: 1;
        user-select: none;
        width: 24px;
      }

      :host(.sm) {
        font-size: 11px;
        height: 20px;
        width: 20px;
      }

      .gear {
        display: block;
        height: 18px;
        width: 18px;
      }

      :host(.sm) .gear {
        height: 15px;
        width: 15px;
      }

      /* Phosphor repaints the platform wordmark green; the gear follows. */
      :host-context(.phosphor-theme) .gear {
        filter: brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(70deg)
          brightness(1.1);
      }
    `,
  ],
})
export class DfAaAgentMarkComponent {
  /** The agent's id (sub of its agent token), e.g. aauth:reports@agent.example. */
  @Input() agentId: string | null | undefined = null;
  @Input() name: string | null | undefined = null;
  /** This DreamFactory's AAuth issuer; identifies the Playground agent. */
  @Input() issuer: string | null | undefined = null;
  /** Force the gear (e.g. a screen that only ever shows the Playground). */
  @Input() self: boolean | null = null;
  @Input() size: 'sm' | 'md' = 'md';

  @HostBinding('attr.aria-hidden') readonly ariaHidden = 'true';
  @HostBinding('attr.data-testid') readonly testId = 'aa-agent-mark';

  @HostBinding('class.sm') get small(): boolean {
    return this.size === 'sm';
  }

  @HostBinding('class.is-playground') get playground(): boolean {
    return this.self ?? isPlaygroundAgent(this.agentId, this.issuer);
  }

  get initial(): string {
    return agentInitial(this.name, this.agentId);
  }
}
