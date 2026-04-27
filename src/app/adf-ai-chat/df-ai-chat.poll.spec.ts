import { Subject, of } from 'rxjs';
import { DfAiChatComponent } from './df-ai-chat.component';
import { ChatSession } from './types/chat';

/**
 * Pure-class tests targeting the polling lifecycle. The component template
 * uses transloco; we test the class directly to avoid the ESM-import chain.
 */
describe('DfAiChatComponent (polling lifecycle)', () => {
  let component: DfAiChatComponent;
  let api: {
    listChatServices: jest.Mock;
    listSessions: jest.Mock;
    getSession: jest.Mock;
    createSession: jest.Mock;
    sendMessage: jest.Mock;
    deleteSession: jest.Mock;
  };

  const baseSession: ChatSession = {
    id: 7,
    service_id: 1,
    ai_service_id: 1,
    ai_role_id: 12,
    status: 'active',
    messages: [],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    api = {
      listChatServices: jest.fn().mockReturnValue(of({ resource: [] })),
      listSessions: jest.fn().mockReturnValue(of({ resource: [] })),
      getSession: jest.fn().mockReturnValue(of(baseSession)),
      createSession: jest.fn().mockReturnValue(of(baseSession)),
      sendMessage: jest.fn(),
      deleteSession: jest.fn().mockReturnValue(of({})),
    };

    // Inject() in field initializers means we need to construct via Reflect-ish
    // shortcut — but Angular's inject() runs in an injection context. Easier
    // to instantiate, then patch private fields.
    component = Object.create(DfAiChatComponent.prototype);
    Object.assign(component, {
      api,
      route: { snapshot: { queryParamMap: { get: () => null } }, paramMap: of({ get: () => null }) },
      router: {},
      cdr: { markForCheck: () => undefined },
      chatServices: [],
      sessions: [],
      selectedServiceName: 'demo',
      activeSession: { ...baseSession, messages: [] },
      autoScrollPinned: true,
      inFlightSends: 0,
      awaitingAssistant: false,
      optimisticIdCounter: -1,
      pollTimer: null,
      subs: [],
      messageScroll: undefined,
      // private methods used during send
      scrollToBottom: () => undefined,
      extractError: () => 'err',
    });
  });

  afterEach(() => jest.useRealTimers());

  it('two concurrent sends share a single poll timer that survives until both finish', () => {
    const send1 = new Subject<{ id: number; role: 'assistant'; content: string }>();
    const send2 = new Subject<{ id: number; role: 'assistant'; content: string }>();
    api.sendMessage
      .mockReturnValueOnce(send1.asObservable())
      .mockReturnValueOnce(send2.asObservable());

    component.send('first');
    expect(component['inFlightSends']).toBe(1);
    expect(component.awaitingAssistant).toBe(true);
    expect(component['pollTimer']).not.toBeNull();
    const firstTimer = component['pollTimer'];

    component.send('second');
    expect(component['inFlightSends']).toBe(2);
    // Same timer — startPolling is idempotent.
    expect(component['pollTimer']).toBe(firstTimer);

    // First send completes.
    send1.next({ id: 100, role: 'assistant', content: 'a' });
    send1.complete();
    expect(component['inFlightSends']).toBe(1);
    // Second send is still in flight, so polling must continue.
    expect(component.awaitingAssistant).toBe(true);
    expect(component['pollTimer']).not.toBeNull();

    // Second send completes.
    send2.next({ id: 101, role: 'assistant', content: 'b' });
    send2.complete();
    expect(component['inFlightSends']).toBe(0);
    expect(component.awaitingAssistant).toBe(false);
    expect(component['pollTimer']).toBeNull();
  });

  it('selectService stops any in-flight polling and resets awaitingAssistant', () => {
    const send1 = new Subject<unknown>();
    api.sendMessage.mockReturnValueOnce(send1.asObservable());
    component.send('first');
    expect(component['pollTimer']).not.toBeNull();

    component.chatServices = [
      { id: 1, name: 'demo', label: 'Demo', type: 'ai_chat', isActive: true },
      { id: 2, name: 'other', label: 'Other', type: 'ai_chat', isActive: true },
    ];
    component.selectService('other');

    expect(component['pollTimer']).toBeNull();
    expect(component['inFlightSends']).toBe(0);
    expect(component.awaitingAssistant).toBe(false);
  });

  it('deleting the active session stops polling', () => {
    const send1 = new Subject<unknown>();
    api.sendMessage.mockReturnValueOnce(send1.asObservable());
    component.send('first');
    expect(component['pollTimer']).not.toBeNull();

    component.deleteSession({ ...baseSession });
    // delete is synchronous in our mock (of({}) emits immediately).
    expect(component['pollTimer']).toBeNull();
    expect(component.activeSession).toBeNull();
  });
});
