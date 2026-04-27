import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import { ChatMessage } from '../../types/chat';
import { DfChatToolResultComponent } from '../df-chat-tool-result/df-chat-tool-result.component';

@Component({
  selector: 'df-chat-message',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, DfChatToolResultComponent],
  template: `
    <ng-container [ngSwitch]="message.role">
      <!-- Tool result: collapsible card -->
      <df-chat-tool-result
        *ngSwitchCase="'tool'"
        [message]="message"></df-chat-tool-result>

      <!-- User message: right-aligned bubble -->
      <div *ngSwitchCase="'user'" class="msg msg--user">
        <div class="msg__bubble">
          <p>{{ message.content }}</p>
        </div>
      </div>

      <!-- Assistant message: left-aligned bubble -->
      <div *ngSwitchCase="'assistant'" class="msg msg--assistant">
        <div class="msg__avatar">
          <fa-icon [icon]="faRobot"></fa-icon>
        </div>
        <div class="msg__bubble">
          <p *ngIf="message.content">{{ message.content }}</p>
          <p *ngIf="!message.content" class="msg__empty">(no text response)</p>
          <div *ngIf="hasToolCalls" class="msg__tool-calls">
            <div *ngFor="let tc of message.tool_calls" class="msg__tool-call">
              <span class="msg__tool-call-name">{{ tc.name }}</span>
              <span *ngIf="tc.service" class="msg__tool-call-service">{{
                tc.service
              }}</span>
            </div>
          </div>
          <div *ngIf="hasUsage" class="msg__usage">
            <span *ngIf="message.input_tokens != null"
              >in {{ message.input_tokens }}t</span
            >
            <span *ngIf="message.output_tokens != null"
              >out {{ message.output_tokens }}t</span
            >
            <span *ngIf="message.latency_ms != null"
              >{{ message.latency_ms }}ms</span
            >
          </div>
        </div>
      </div>

      <!-- Fallback: system / unknown -->
      <div *ngSwitchDefault class="msg msg--system">
        <div class="msg__bubble">
          <p>{{ message.content }}</p>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .msg {
        display: flex;
        gap: 0.75rem;
        max-width: 100%;

        &--user {
          justify-content: flex-end;

          .msg__bubble {
            background: #2563eb;
            color: #fff;
            border-bottom-right-radius: 4px;
          }
        }

        &--assistant {
          justify-content: flex-start;
          align-items: flex-start;

          .msg__bubble {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-bottom-left-radius: 4px;
          }
        }

        &--system {
          justify-content: center;

          .msg__bubble {
            background: rgba(255, 255, 255, 0.04);
            color: rgba(255, 255, 255, 0.6);
            font-style: italic;
            font-size: 0.875rem;
          }
        }

        &__avatar {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background: rgba(96, 165, 250, 0.15);
          color: #60a5fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
        }

        &__bubble {
          padding: 0.75rem 1rem;
          border-radius: 14px;
          max-width: min(720px, 80%);

          p {
            margin: 0 0 0.5rem;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.5;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }

        &__empty {
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
          font-size: 0.875rem;
        }

        &__tool-calls {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.7);
        }

        &__tool-call {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        &__tool-call-name {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 0.8125rem;
        }

        &__tool-call-service {
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          font-size: 0.7rem;
        }

        &__usage {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.45);
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
        }
      }
    `,
  ],
})
export class DfChatMessageComponent {
  @Input({ required: true }) message!: ChatMessage;

  faRobot = faRobot;
  faUser = faUser;

  get hasToolCalls(): boolean {
    return !!(this.message.tool_calls && this.message.tool_calls.length);
  }

  get hasUsage(): boolean {
    return (
      this.message.input_tokens != null ||
      this.message.output_tokens != null ||
      this.message.latency_ms != null
    );
  }
}
