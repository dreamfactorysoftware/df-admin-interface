/**
 * The Try it sequence diagram: which participant each step talks to, the
 * colour its arrow lands with, and which step is new since the last check
 * (the only thing that animates). Pure, no Angular.
 */
import { PlaygroundRun, PlaygroundStep, StepKind } from '../aauth.types';
import { pathOf, statusVariant } from '../jwt-view';

/** The three participants, left to right: Agent, API (resource), Person Server. */
export type Lane = 'agent' | 'api' | 'ps';
export const LANES: readonly Lane[] = ['agent', 'api', 'ps'];

export type Tone = ReturnType<typeof statusVariant>;

/** Steps the playground emits, by the participant they call. */
const KIND_LANE: Record<StepKind, Lane> = {
  agent_token: 'agent',
  reuse: 'agent',
  call: 'api',
  discover: 'ps',
  person_token: 'ps',
  auth_token: 'ps',
  poll: 'ps',
};

/** Person Server endpoints (design 4.3), for steps of an unknown kind. */
const PS_PATH =
  /^\/(?:\.well-known\/aauth-person\.json|aauth\/(?:person|token|pending|interact))(?:[/?]|$)/;

/**
 * The participant a step calls. Steps without a request (agent token minted,
 * cached tokens reused) stay on the Agent lane. Resource, PS and agent share
 * one origin here, so the kind decides; the URL path is the fallback for a
 * kind this UI does not know yet.
 */
export function laneOf(step: PlaygroundStep): Lane {
  if (!step.request) return 'agent';
  const byKind = KIND_LANE[step.kind];
  if (byKind && byKind !== 'agent') return byKind;
  return PS_PATH.test(pathOf(step.request.url)) ? 'ps' : 'api';
}

/** Arrowhead colour: the response status (401 warning, 202 accent, ...). */
export function toneOf(step: PlaygroundStep): Tone {
  return statusVariant(step.response?.status);
}

/**
 * Remembers how many steps of the run on screen were already drawn, so only
 * the newest step draws in. A new run starts from zero; a poll that replaces
 * the previous poll in place is not new. `quiet` marks everything already
 * there as seen (coming back to the tab replays nothing).
 */
export class StepEntrance {
  /** Index of the step that animates, or -1. */
  index = -1;
  private runId: string | null = null;
  private seen = 0;

  update(run: PlaygroundRun | null, quiet = false): void {
    const id = run?.runId ?? null;
    const n = run?.steps?.length ?? 0;
    if (id !== this.runId) {
      this.runId = id;
      this.seen = quiet ? n : 0;
      this.index = -1;
    }
    if (n > this.seen) this.index = n - 1;
    else if (n < this.seen) this.index = -1;
    this.seen = n;
  }
}
