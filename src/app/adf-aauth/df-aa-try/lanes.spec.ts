import { PlaygroundStep, StepKind } from '../aauth.types';
import { run } from '../aauth-testing';
import { StepEntrance, laneOf, toneOf } from './lanes';

const ISSUER = 'https://df.example.test';

function step(
  kind: StepKind,
  url: string | null,
  status: number | null = null
): PlaygroundStep {
  return {
    kind,
    title: kind,
    request: url ? { method: 'GET', url, headers: [], body: null } : null,
    response: status ? { status, headers: [], body: null } : null,
    tokens: [],
  };
}

describe('laneOf', () => {
  it('keeps steps that call nothing on the Agent lane', () => {
    expect(laneOf(step('agent_token', null))).toBe('agent');
    expect(laneOf(step('reuse', null))).toBe('agent');
  });

  it('sends calls to the API', () => {
    expect(
      laneOf(step('call', `${ISSUER}/api/v2/sales/_table/orders?limit=5`, 401))
    ).toBe('api');
  });

  it('sends discovery, token requests and polls to the Person Server', () => {
    expect(
      laneOf(step('discover', `${ISSUER}/.well-known/aauth-person.json`))
    ).toBe('ps');
    expect(laneOf(step('person_token', `${ISSUER}/aauth/person`))).toBe('ps');
    expect(laneOf(step('auth_token', `${ISSUER}/aauth/token`))).toBe('ps');
    expect(laneOf(step('poll', `${ISSUER}/aauth/pending/N6yy2_kAgau`))).toBe(
      'ps'
    );
  });

  it('goes by kind, not host: an external Person Server is still the Person Server', () => {
    expect(
      laneOf(step('person_token', 'https://ps.elsewhere.test/v1/person-token'))
    ).toBe('ps');
  });

  it('falls back to the URL path for a kind it does not know', () => {
    const unknown = (url: string) =>
      laneOf(step('later_kind' as StepKind, url));
    expect(unknown(`${ISSUER}/aauth/pending/abc`)).toBe('ps');
    expect(unknown(`${ISSUER}/aauth/token`)).toBe('ps');
    expect(unknown(`${ISSUER}/.well-known/aauth-person.json`)).toBe('ps');
    expect(unknown(`${ISSUER}/aauth/authorize`)).toBe('api');
    expect(unknown(`${ISSUER}/aauth/tokens-report`)).toBe('api');
    expect(unknown(`${ISSUER}/api/v2/sales/_table/orders`)).toBe('api');
    expect(laneOf(step('later_kind' as StepKind, null))).toBe('agent');
  });
});

describe('toneOf', () => {
  it('colours the arrowhead by the response status', () => {
    const at = (status: number | null) => toneOf(step('call', ISSUER, status));
    expect(at(401)).toBe('warning');
    expect(at(200)).toBe('success');
    expect(at(202)).toBe('accent');
    expect(at(403)).toBe('danger');
    expect(at(502)).toBe('danger');
    expect(at(null)).toBe('neutral');
  });
});

describe('StepEntrance', () => {
  const steps = (n: number, kind: StepKind = 'call') =>
    Array.from({ length: n }, () => step(kind, ISSUER, 200));

  it('animates only the newest step of a new run', () => {
    const e = new StepEntrance();
    e.update(null);
    expect(e.index).toBe(-1);
    e.update(run({ runId: 'a', steps: steps(4) }));
    expect(e.index).toBe(3);
    // Unchanged on the next check: the class stays on the same row.
    e.update(run({ runId: 'a', steps: steps(4) }));
    expect(e.index).toBe(3);
    e.update(run({ runId: 'a', steps: steps(5) }));
    expect(e.index).toBe(4);
  });

  it('does not replay a poll that replaced the previous poll', () => {
    const e = new StepEntrance();
    e.update(run({ runId: 'a', steps: steps(5, 'poll') }));
    expect(e.index).toBe(4);
    e.update(run({ runId: 'a', steps: steps(5, 'poll') }));
    expect(e.index).toBe(4);
    e.update(run({ runId: 'a', steps: steps(4) }));
    expect(e.index).toBe(-1);
  });

  it('starts over for a new run, and stays still when primed quietly', () => {
    const e = new StepEntrance();
    e.update(run({ runId: 'a', steps: steps(6) }), true);
    expect(e.index).toBe(-1);
    e.update(run({ runId: 'a', steps: steps(6) }));
    expect(e.index).toBe(-1);
    e.update(run({ runId: 'b', steps: steps(2) }));
    expect(e.index).toBe(1);
  });
});
