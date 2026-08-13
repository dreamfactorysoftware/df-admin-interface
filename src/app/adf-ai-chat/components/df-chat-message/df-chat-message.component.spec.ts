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
      expect(component.segments).toEqual([
        { type: 'text', text: 'hello world' },
      ]);
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
      expect(
        segs.filter(s => s.type === 'text').map(s => s.text.trim())
      ).toEqual(['middle']);
    });

    it('handles a code block that takes up the whole message', () => {
      component.message = msg({ content: '```python\nprint(1)\n```' });
      expect(component.segments).toEqual([
        { type: 'code', text: 'print(1)\n' },
      ]);
    });
  });

  describe('suggestions', () => {
    const chips = () =>
      fixture.nativeElement.querySelectorAll(
        '.msg__suggestion'
      ) as NodeListOf<HTMLButtonElement>;

    it('strips a trailing suggestions fence and surfaces its lines', () => {
      component.message = msg({
        content: 'Here you go.\n```suggestions\nShow revenue\nList tables\n```',
      });
      expect(component.segments).toEqual([
        { type: 'text', text: 'Here you go.\n' },
      ]);
      expect(component.suggestions).toEqual(['Show revenue', 'List tables']);
    });

    it('tolerates stray bullets/quotes, dedupes, and caps at 4 chips', () => {
      component.message = msg({
        content: [
          '```suggestions',
          '- One',
          '2) Two',
          '"Three"',
          'Three',
          '',
          'x'.repeat(121), // over the per-chip length cap: dropped
          'Four',
          'Five',
          '```',
        ].join('\n'),
      });
      expect(component.suggestions).toEqual(['One', 'Two', 'Three', 'Four']);
    });

    it('returns no suggestions when there is no suggestions fence', () => {
      component.message = msg({
        content: 'plain text\n```sql\nSELECT 1;\n```',
      });
      expect(component.suggestions).toEqual([]);
    });

    it('keeps a mid-message suggestions fence as ordinary code', () => {
      component.message = msg({
        content: 'Format:\n```suggestions\nExample line\n```\ntrailing text',
      });
      expect(component.suggestions).toEqual([]);
      expect(component.segments).toEqual([
        { type: 'text', text: 'Format:\n' },
        { type: 'code', text: 'Example line\n' },
        { type: 'text', text: '\ntrailing text' },
      ]);
    });

    it('renders an unclosed suggestions fence as literal text, no chips', () => {
      const content = 'reply\n```suggestions\nA\nB';
      component.message = msg({ content });
      expect(component.suggestions).toEqual([]);
      expect(component.segments).toEqual([{ type: 'text', text: content }]);
    });

    it('keeps a trailing suggestions fence with no valid lines as code', () => {
      component.message = msg({ content: 'reply\n```suggestions\n\n \n```' });
      expect(component.suggestions).toEqual([]);
      expect(component.segments).toEqual([
        { type: 'text', text: 'reply\n' },
        { type: 'code', text: '\n \n' },
      ]);
    });

    it('renders chip buttons when showSuggestions is set and emits on click', () => {
      fixture.componentRef.setInput(
        'message',
        msg({
          content: 'Done.\n```suggestions\nShow revenue\nList tables\n```',
        })
      );
      fixture.componentRef.setInput('showSuggestions', true);
      fixture.detectChanges();

      const buttons = chips();
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent?.trim()).toBe('Show revenue');
      // The fence itself must not be rendered as a code block.
      expect(fixture.nativeElement.querySelector('.msg__code')).toBeNull();

      const picked: string[] = [];
      component.suggestionSelected.subscribe((s: string) => picked.push(s));
      buttons[1].click();
      expect(picked).toEqual(['List tables']);
    });

    it('renders no chips while a reply is in flight (showSuggestions off)', () => {
      fixture.componentRef.setInput(
        'message',
        msg({ content: 'Done.\n```suggestions\nShow revenue\n```' })
      );
      fixture.componentRef.setInput('showSuggestions', false);
      fixture.detectChanges();
      expect(chips().length).toBe(0);
    });

    it('renders no chips when the content has no suggestions fence', () => {
      fixture.componentRef.setInput('message', msg({ content: 'plain reply' }));
      fixture.componentRef.setInput('showSuggestions', true);
      fixture.detectChanges();
      expect(chips().length).toBe(0);
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
