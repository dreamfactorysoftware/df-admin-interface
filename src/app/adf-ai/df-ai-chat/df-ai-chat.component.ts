import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

import { DfAiChatService } from './df-ai-chat.service';
import {
  ChatEntry,
  ServiceInfo,
} from './df-ai-chat.types';

@Component({
  selector: 'df-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  templateUrl: './df-ai-chat.component.html',
  styleUrls: ['./df-ai-chat.component.scss'],
})
export class DfAiChatComponent implements OnInit {
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // Config state
  aiServices: ServiceInfo[] = [];
  dbServices: string[] = [];
  supportsToolUse = false;
  configured = false;
  appName: string | null = null;
  roleName: string | null = null;

  // Selections
  selectedAiService = '';

  // Chat state
  chatHistory: ChatEntry[] = [];
  userInput = '';
  loading = false;
  configLoading = false;
  error = '';

  // Conversation messages sent to backend (accumulates)
  private conversationMessages: { role: string; content: string }[] = [];

  constructor(
    private chatService: DfAiChatService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAiServices();
  }

  loadAiServices(): void {
    this.chatService.getAiServices().subscribe({
      next: (res) => (this.aiServices = res.resource || []),
      error: () =>
        this.snackBar.open('Failed to load AI services', 'OK', { duration: 5000 }),
    });
  }

  onAiServiceChange(): void {
    if (!this.selectedAiService) {
      this.resetConfig();
      return;
    }

    this.configLoading = true;
    this.resetConfig();

    this.chatService.getConfig(this.selectedAiService).subscribe({
      next: (config) => {
        this.configLoading = false;
        this.configured = config.configured;
        this.supportsToolUse = config.supportsToolUse;
        this.appName = config.appName;
        this.roleName = config.roleName;
        this.dbServices = config.databaseServices || [];

        if (!config.configured) {
          this.error =
            'No API key configured for this AI service. An admin must select a Data Access API Key in the service settings.';
        } else if (!this.supportsToolUse) {
          this.error =
            'This AI provider does not support tool use. Data chat requires a provider with tool/function calling support (e.g., Anthropic Claude, OpenAI GPT-4).';
        } else if (this.dbServices.length === 0) {
          this.error =
            'The configured role has no access to any database services. Assign database permissions to the role first.';
        } else {
          this.error = '';
        }
      },
      error: (err) => {
        this.configLoading = false;
        this.snackBar.open(
          'Failed to load config: ' +
            (err.error?.error?.message || err.message),
          'OK',
          { duration: 5000 }
        );
      },
    });
  }

  get canSend(): boolean {
    return (
      !this.loading &&
      !!this.selectedAiService &&
      this.configured &&
      this.supportsToolUse &&
      this.dbServices.length > 0 &&
      this.userInput.trim().length > 0
    );
  }

  send(): void {
    if (!this.canSend) return;

    const userMessage = this.userInput.trim();
    this.userInput = '';
    this.error = '';

    this.chatHistory.push({ role: 'user', content: userMessage });
    this.conversationMessages.push({ role: 'user', content: userMessage });

    this.loading = true;
    this.scrollToBottom();

    this.chatService
      .chat(this.selectedAiService, {
        messages: this.conversationMessages,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;

          this.chatHistory.push({
            role: 'assistant',
            content: response.content || '(No response)',
            toolCalls: response.toolCallsMade,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            latencyMs: response.latencyMs,
            iterations: response.iterations,
          });

          this.conversationMessages.push({
            role: 'assistant',
            content: response.content || '',
          });

          this.scrollToBottom();
        },
        error: (err) => {
          this.loading = false;
          this.error =
            err.error?.error?.message || err.message || 'Request failed';
          this.conversationMessages.pop();
          this.scrollToBottom();
        },
      });
  }

  newChat(): void {
    this.chatHistory = [];
    this.conversationMessages = [];
    this.error = '';
    this.userInput = '';

    // Re-fetch config to pick up any changes (e.g. role permissions fixed)
    if (this.selectedAiService) {
      this.refreshConfig();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  formatToolInput(input: Record<string, unknown>): string {
    return JSON.stringify(input, null, 2);
  }

  private refreshConfig(): void {
    if (!this.selectedAiService) return;
    this.configLoading = true;
    this.chatService.getConfig(this.selectedAiService).subscribe({
      next: (config) => {
        this.configLoading = false;
        this.configured = config.configured;
        this.supportsToolUse = config.supportsToolUse;
        this.appName = config.appName;
        this.roleName = config.roleName;
        this.dbServices = config.databaseServices || [];

        if (!config.configured) {
          this.error =
            'No API key configured for this AI service. An admin must select a Data Access API Key in the service settings.';
        } else if (!this.supportsToolUse) {
          this.error =
            'This AI provider does not support tool use. Data chat requires a provider with tool/function calling support (e.g., Anthropic Claude, OpenAI GPT-4).';
        } else if (this.dbServices.length === 0) {
          this.error =
            'The configured role has no access to any database services. Assign database permissions to the role first.';
        } else {
          this.error = '';
        }
      },
      error: (err) => {
        this.configLoading = false;
        this.snackBar.open(
          'Failed to load config: ' +
            (err.error?.error?.message || err.message),
          'OK',
          { duration: 5000 }
        );
      },
    });
  }

  private resetConfig(): void {
    this.configured = false;
    this.supportsToolUse = false;
    this.appName = null;
    this.roleName = null;
    this.dbServices = [];
    this.error = '';
    this.newChat();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        const el = this.chatContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
