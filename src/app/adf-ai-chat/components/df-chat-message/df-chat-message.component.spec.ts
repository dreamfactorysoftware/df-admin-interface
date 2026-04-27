import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChatMessage } from '../../types/chat';
import { DfChatMessageComponent } from './df-chat-message.component';

function msg(over: Partial<ChatMessage>): ChatMessage {
  return {
    id: 1,
    session_id: 1,
    role: 'assistant',
    content: null,
    ...over,
  };
}

describe('DfChatMessageComponent', () => {
  let fixture: ComponentFixture<DfChatMessageComponent>;
  let component: DfChatMessageComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfChatMessageComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(DfChatMessageComponent);
    component = fixture.componentInstance;
  });

  describe('segments', () => {
    it('returns empty array for null content', () => {
      component.message = msg({ content: null });
      expect(component.segments).toEqual([]);
    });

    it('returns single text segment when no code block', () => {
      component.message = msg({ content: 'hello world' });
      expect(component.segments).toEqual([{ type: 'text', text: 'hello world' }]);
    });

    it('extracts a fenced code block in the middle of text', () => {
      component.message = msg({
        content: 'before\n```js\nconst x = 1;\n```\nafter',
      });
      expect(component.segments).toEqual([
        { type: 'text', text: 'before\n' },
        { type: 'code', text: 'const x = 1;\n' },
        { type: 'text', text: '\nafter' },
      ]);
    });

    it('handles multiple code blocks', () => {
      component.message = msg({
        content: '```\na\n```\nmiddle\n```\nb\n```',
      });
      const segs = component.segments;
      expect(segs.filter(s => s.type === 'code').map(s => s.text)).toEqual([
        'a\n',
        'b\n',
      ]);
      expect(segs.filter(s => s.type === 'text').map(s => s.text.trim())).toEqual(
        ['middle']
      );
    });

    it('handles a code block that takes up the whole message', () => {
      component.message = msg({ content: '```python\nprint(1)\n```' });
      expect(component.segments).toEqual([
        { type: 'code', text: 'print(1)\n' },
      ]);
    });
  });

  describe('flags', () => {
    it('hasToolCalls is true when tool_calls is non-empty', () => {
      component.message = msg({
        tool_calls: [{ name: 'get_table_data' }],
      });
      expect(component.hasToolCalls).toBe(true);
    });

    it('hasToolCalls is false when tool_calls is null/empty', () => {
      component.message = msg({ tool_calls: null });
      expect(component.hasToolCalls).toBe(false);
      component.message = msg({ tool_calls: [] });
      expect(component.hasToolCalls).toBe(false);
    });

    it('hasUsage true when any usage stat present', () => {
      component.message = msg({ input_tokens: 10 });
      expect(component.hasUsage).toBe(true);
      component.message = msg({ latency_ms: 100 });
      expect(component.hasUsage).toBe(true);
    });

    it('hasUsage false when all usage stats absent', () => {
      component.message = msg({});
      expect(component.hasUsage).toBe(false);
    });
  });
});
