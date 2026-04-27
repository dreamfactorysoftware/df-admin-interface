import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChatMessage } from '../../types/chat';
import { DfChatToolResultComponent } from './df-chat-tool-result.component';

function makeMessage(over: Partial<ChatMessage>): ChatMessage {
  return {
    id: 1,
    session_id: 1,
    role: 'tool',
    content: '',
    ...over,
  };
}

describe('DfChatToolResultComponent', () => {
  let fixture: ComponentFixture<DfChatToolResultComponent>;
  let component: DfChatToolResultComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfChatToolResultComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(DfChatToolResultComponent);
    component = fixture.componentInstance;
  });

  it('starts collapsed by default', () => {
    component.message = makeMessage({ content: '{}' });
    fixture.detectChanges();
    expect(component.expanded).toBe(false);
  });

  it('auto-expands when message.is_error is true', () => {
    component.message = makeMessage({ is_error: true, content: 'oops' });
    fixture.detectChanges();
    expect(component.expanded).toBe(true);
  });

  it('respects startExpanded input', () => {
    component.message = makeMessage({});
    component.startExpanded = true;
    fixture.detectChanges();
    expect(component.expanded).toBe(true);
  });

  it('toggles expansion on header click', () => {
    component.message = makeMessage({});
    fixture.detectChanges();
    expect(component.expanded).toBe(false);
    component.expanded = true;
    expect(component.expanded).toBe(true);
  });

  it('pretty-prints valid JSON content', () => {
    component.message = makeMessage({
      content: '{"a":1,"b":[2,3]}',
    });
    fixture.detectChanges();
    expect(component.pretty).toBe('{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}');
  });

  it('returns invalid JSON content as-is', () => {
    component.message = makeMessage({ content: '{not json}' });
    fixture.detectChanges();
    expect(component.pretty).toBe('{not json}');
  });

  it('returns plain text content as-is', () => {
    component.message = makeMessage({ content: 'just words' });
    fixture.detectChanges();
    expect(component.pretty).toBe('just words');
  });

  it('shows "(empty)" for blank content', () => {
    component.message = makeMessage({ content: '   ' });
    fixture.detectChanges();
    expect(component.pretty).toBe('(empty)');
  });

  it('handles null content gracefully', () => {
    component.message = makeMessage({ content: null });
    fixture.detectChanges();
    expect(component.pretty).toBe('(empty)');
  });
});
