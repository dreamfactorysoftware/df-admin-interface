import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'df-chat-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <form
      class="chat-input"
      [class.chat-input--busy]="busy"
      (submit)="onSubmit($event)">
      <textarea
        #textarea
        class="chat-input__field"
        [(ngModel)]="value"
        name="message"
        rows="1"
        [placeholder]="placeholder"
        [disabled]="busy || disabled"
        (input)="autoGrow()"
        (keydown)="onKeydown($event)"></textarea>
      <button
        type="submit"
        class="chat-input__send"
        [disabled]="!canSend"
        [attr.aria-label]="'Send'">
        <mat-spinner *ngIf="busy" diameter="18"></mat-spinner>
        <fa-icon *ngIf="!busy" [icon]="faPaperPlane"></fa-icon>
      </button>
    </form>
  `,
  styles: [
    `
      .chat-input {
        display: flex;
        align-items: flex-end;
        gap: 0.625rem;
        padding: 0.75rem 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);

        &__field {
          flex: 1;
          min-height: 2.5rem;
          max-height: 8rem;
          padding: 0.625rem 0.875rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.25);
          color: inherit;
          font: inherit;
          resize: none;
          line-height: 1.4;

          &:focus {
            outline: none;
            border-color: #60a5fa;
          }

          &:disabled {
            opacity: 0.6;
          }
        }

        &__send {
          width: 2.5rem;
          height: 2.5rem;
          flex-shrink: 0;
          border: none;
          border-radius: 999px;
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 120ms ease;

          &:hover:not(:disabled) {
            background: #1d4ed8;
          }

          &:disabled {
            background: rgba(255, 255, 255, 0.08);
            color: rgba(255, 255, 255, 0.3);
            cursor: not-allowed;
          }
        }
      }
    `,
  ],
})
export class DfChatInputComponent {
  @Input() busy = false;
  @Input() disabled = false;
  @Input() placeholder = 'Ask anything about your data…';
  @Output() send = new EventEmitter<string>();

  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  value = '';
  faPaperPlane = faPaperPlane;

  get canSend(): boolean {
    return !this.busy && !this.disabled && this.value.trim().length > 0;
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.canSend) {
      return;
    }
    const text = this.value.trim();
    this.value = '';
    this.send.emit(text);
    setTimeout(() => this.autoGrow());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit(event);
    }
  }

  autoGrow(): void {
    const el = this.textarea?.nativeElement;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }
}
