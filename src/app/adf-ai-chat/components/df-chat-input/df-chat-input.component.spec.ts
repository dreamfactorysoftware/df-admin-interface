import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DfChatInputComponent } from './df-chat-input.component';

describe('DfChatInputComponent', () => {
  let fixture: ComponentFixture<DfChatInputComponent>;
  let component: DfChatInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DfChatInputComponent, NoopAnimationsModule],
    });
    fixture = TestBed.createComponent(DfChatInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('canSend', () => {
    it('false when value is empty', () => {
      component.value = '';
      expect(component.canSend).toBe(false);
    });

    it('false when value is only whitespace', () => {
      component.value = '   \n  ';
      expect(component.canSend).toBe(false);
    });

    it('false when busy', () => {
      component.value = 'hi';
      component.busy = true;
      expect(component.canSend).toBe(false);
    });

    it('false when disabled', () => {
      component.value = 'hi';
      component.disabled = true;
      expect(component.canSend).toBe(false);
    });

    it('true with non-empty value, not busy, not disabled', () => {
      component.value = 'hello';
      expect(component.canSend).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('emits trimmed value and clears the field', () => {
      const spy = jest.fn();
      component.send.subscribe(spy);
      component.value = '  hello world  ';
      component.onSubmit(new Event('submit'));
      expect(spy).toHaveBeenCalledWith('hello world');
      expect(component.value).toBe('');
    });

    it('does nothing when canSend is false', () => {
      const spy = jest.fn();
      component.send.subscribe(spy);
      component.value = '   ';
      component.onSubmit(new Event('submit'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('onKeydown', () => {
    let submitSpy: jest.SpyInstance;

    beforeEach(() => {
      submitSpy = jest.spyOn(component, 'onSubmit');
    });

    it('Enter alone triggers submit', () => {
      component.value = 'hi';
      const ev = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(ev);
      expect(submitSpy).toHaveBeenCalled();
    });

    it('Shift+Enter does NOT submit (allows newline)', () => {
      component.value = 'hi';
      const ev = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      component.onKeydown(ev);
      expect(submitSpy).not.toHaveBeenCalled();
    });

    it('non-Enter keys do nothing', () => {
      const ev = new KeyboardEvent('keydown', { key: 'a' });
      component.onKeydown(ev);
      expect(submitSpy).not.toHaveBeenCalled();
    });
  });
});
