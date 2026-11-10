import { TestBed } from '@angular/core/testing';
import {
  DfAaAgentMarkComponent,
  agentInitial,
  isPlaygroundAgent,
} from './df-aa-agent-mark.component';

const ISSUER = 'https://df.example.test';

describe('isPlaygroundAgent', () => {
  it('is this DreamFactory’s Playground only', () => {
    expect(isPlaygroundAgent('aauth:playground@df.example.test', ISSUER)).toBe(
      true
    );
    expect(
      isPlaygroundAgent('aauth:playground@df.example.test', `${ISSUER}:8443/`)
    ).toBe(true);
    expect(isPlaygroundAgent('AAuth:Playground@DF.example.test', ISSUER)).toBe(
      true
    );
    // The same local id from another provider is just another agent.
    expect(
      isPlaygroundAgent('aauth:playground@agent.example.test', ISSUER)
    ).toBe(false);
    expect(isPlaygroundAgent('aauth:reports@df.example.test', ISSUER)).toBe(
      false
    );
    expect(isPlaygroundAgent('aauth:playground@df.example.test', null)).toBe(
      false
    );
    expect(isPlaygroundAgent(null, ISSUER)).toBe(false);
  });
});

describe('agentInitial', () => {
  it('takes the name first, then the agent id without its scheme', () => {
    expect(agentInitial('Acme Reports', 'aauth:x@h')).toBe('A');
    expect(agentInitial('  élan', null)).toBe('É');
    expect(agentInitial(null, 'aauth:reports@agent.example')).toBe('R');
    expect(agentInitial('', '')).toBe('');
  });
});

describe('DfAaAgentMarkComponent', () => {
  function render(inputs: Partial<DfAaAgentMarkComponent>) {
    const fixture = TestBed.createComponent(DfAaAgentMarkComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the DreamFactory gear for the Playground, never a remote logo', () => {
    const el = render({
      agentId: 'aauth:playground@df.example.test',
      name: 'DreamFactory Playground',
      issuer: ISSUER,
    });
    const img = el.querySelector('img');
    // The brand mark (gear + database), not df-cog.svg: that is the spinner.
    expect(img?.getAttribute('src')).toBe('assets/img/df-mark.svg');
    expect(img?.getAttribute('alt')).toBe('');
    expect(el.classList).toContain('is-playground');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows a monogram for any other agent', () => {
    const el = render({
      agentId: 'aauth:reports@agent.example',
      name: 'Acme Reports',
      issuer: ISSUER,
      size: 'sm',
    });
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent?.trim()).toBe('A');
    expect(el.classList).toContain('sm');
  });

  it('`self` forces the gear (this DreamFactory as a Person Server)', () => {
    const el = render({ self: true, name: 'This DreamFactory' });
    expect(el.querySelector('img')).toBeTruthy();
  });
});
