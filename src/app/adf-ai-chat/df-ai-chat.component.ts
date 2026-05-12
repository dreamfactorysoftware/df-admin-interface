import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { Subscription, finalize } from 'rxjs';
import { AiChatService } from './services/ai-chat.service';
import { ChatMessage, ChatService, ChatSession } from './types/chat';
import { DfChatInputComponent } from './components/df-chat-input/df-chat-input.component';
import { DfChatMessageComponent } from './components/df-chat-message/df-chat-message.component';
import { DfChatSessionListComponent } from './components/df-chat-session-list/df-chat-session-list.component';

@Component({
  selector: 'df-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
    DfChatInputComponent,
    DfChatMessageComponent,
    DfChatSessionListComponent,
  ],
  templateUrl: './df-ai-chat.component.html',
  styleUrls: ['./df-ai-chat.component.scss'],
})
export class DfAiChatComponent implements OnInit, OnDestroy {
  private api = inject(AiChatService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('messageScroll') messageScroll?: ElementRef<HTMLDivElement>;

  chatServices: ChatService[] = [];
  selectedServiceName: string | null = null;
  loadingServices = true;

  sessions: ChatSession[] = [];
  loadingSessions = false;

  activeSession: ChatSession | null = null;
  loadingSession = false;
  awaitingAssistant = false;

  errorMessage: string | null = null;

  faDatabase = faDatabase;

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlightSends = 0;
  private subs: Subscription[] = [];
  private optimisticIdCounter = -1;
  private autoScrollPinned = true;

  ngOnInit(): void {
    this.api.listChatServices().subscribe({
      next: res => {
        this.chatServices = (res.resource ?? []).filter(
          s => s.isActive !== false
        );
        this.loadingServices = false;
        const initial =
          this.route.snapshot.queryParamMap.get('service') ??
          this.chatServices[0]?.name ??
          null;
        if (initial) {
          this.selectService(initial);
        }
      },
      error: err => {
        this.loadingServices = false;
        this.errorMessage = this.extractError(err);
      },
    });

    // If a sessionId is in the route, load it once we know the service.
    this.subs.push(
      this.route.paramMap.subscribe(params => {
        const idStr = params.get('sessionId');
        if (idStr && this.selectedServiceName) {
          this.openSession(Number(idStr));
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.subs.forEach(s => s.unsubscribe());
  }

  selectService(name: string): void {
    if (this.selectedServiceName === name) {
      return;
    }
    this.selectedServiceName = name;
    this.activeSession = null;
    this.stopPolling();
    this.inFlightSends = 0;
    this.awaitingAssistant = false;
    this.loadSessions();
  }

  private loadSessions(): void {
    if (!this.selectedServiceName) {
      return;
    }
    this.loadingSessions = true;
    this.api
      .listSessions(this.selectedServiceName)
      .pipe(finalize(() => (this.loadingSessions = false)))
      .subscribe({
        next: res => {
          this.sessions = res.resource ?? [];
          // Auto-open most recent session if any.
          if (!this.activeSession && this.sessions.length > 0) {
            this.openSession(this.sessions[0].id);
          }
        },
        error: err => (this.errorMessage = this.extractError(err)),
      });
  }

  newChat(): void {
    if (!this.selectedServiceName) {
      return;
    }
    this.errorMessage = null;
    this.api.createSession(this.selectedServiceName, {}).subscribe({
      next: session => {
        // Empty session has no messages; show it immediately.
        this.activeSession = { ...session, messages: [] };
        this.sessions = [this.activeSession, ...this.sessions];
        this.scrollToBottom();
      },
      error: err => (this.errorMessage = this.extractError(err)),
    });
  }

  openSession(id: number): void {
    if (!this.selectedServiceName) {
      return;
    }
    this.loadingSession = true;
    this.errorMessage = null;
    this.api
      .getSession(this.selectedServiceName, id)
      .pipe(finalize(() => (this.loadingSession = false)))
      .subscribe({
        next: session => {
          this.activeSession = session;
          // Opening a session: always pin to bottom regardless of prior state.
          this.autoScrollPinned = true;
          this.scrollToBottom(true);
        },
        error: err => (this.errorMessage = this.extractError(err)),
      });
  }

  deleteSession(s: ChatSession): void {
    if (!this.selectedServiceName) {
      return;
    }
    if (!confirm(`Delete session "${s.title || `Session ${s.id}`}"?`)) {
      return;
    }
    this.api.deleteSession(this.selectedServiceName, s.id).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(x => x.id !== s.id);
        if (this.activeSession?.id === s.id) {
          this.activeSession = null;
          this.stopPolling();
          this.awaitingAssistant = false;
        }
      },
      error: err => (this.errorMessage = this.extractError(err)),
    });
  }

  send(text: string): void {
    if (!this.selectedServiceName || !this.activeSession) {
      return;
    }
    const sessionId = this.activeSession.id;
    const optimistic: ChatMessage = {
      id: this.optimisticIdCounter--,
      session_id: sessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    this.activeSession = {
      ...this.activeSession,
      messages: [...(this.activeSession.messages ?? []), optimistic],
    };
    this.scrollToBottom(true);

    this.inFlightSends++;
    this.awaitingAssistant = true;
    this.startPolling(sessionId);

    this.api
      .sendMessage(this.selectedServiceName, sessionId, text)
      .pipe(
        finalize(() => {
          this.inFlightSends = Math.max(0, this.inFlightSends - 1);
          if (this.inFlightSends === 0) {
            this.awaitingAssistant = false;
            this.stopPolling();
          }
          // Final reconciliation regardless — pulls the canonical state.
          this.refreshActiveSession(sessionId);
        })
      )
      .subscribe({
        next: () => {
          // Final reconciliation handled by finalize.
        },
        error: err => {
          this.errorMessage = this.extractError(err);
        },
      });
  }

  /**
   * Idempotent: starts the poll timer once. Concurrent sends share a single
   * timer that runs while inFlightSends > 0.
   */
  private startPolling(sessionId: number): void {
    if (this.pollTimer) {
      return;
    }
    const tick = () => {
      this.refreshActiveSession(sessionId);
      this.pollTimer = setTimeout(tick, 1000);
    };
    this.pollTimer = setTimeout(tick, 1000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private refreshActiveSession(sessionId: number): void {
    if (!this.selectedServiceName) {
      return;
    }
    this.api.getSession(this.selectedServiceName, sessionId).subscribe({
      next: session => {
        // Don't clobber if user switched to a different session mid-poll.
        if (this.activeSession?.id !== sessionId) {
          return;
        }
        this.activeSession = session;
        this.scrollToBottom();
      },
      error: () => {
        /* swallow during polling */
      },
    });
  }

  /**
   * Track whether the user is currently scrolled near the bottom. We only
   * auto-scroll on new messages when they are — otherwise scroll position
   * gets ripped away while they're reading history.
   */
  onMessagesScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.autoScrollPinned = distance < 60;
  }

  private scrollToBottom(force = false): void {
    if (!force && !this.autoScrollPinned) {
      return;
    }
    setTimeout(() => {
      const el = this.messageScroll?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
        this.autoScrollPinned = true;
      }
    });
  }

  private extractError(err: unknown): string {
    if (typeof err === 'object' && err !== null) {
      // Angular HttpErrorResponse: err.error.error.message
      const e = err as {
        error?: { error?: { message?: string } };
        message?: string;
      };
      return e.error?.error?.message ?? e.message ?? 'Something went wrong.';
    }
    return 'Something went wrong.';
  }

  get messages(): ChatMessage[] {
    return this.activeSession?.messages ?? [];
  }

  get dataScope(): string[] {
    return this.activeSession?.data_services ?? [];
  }

  trackMsg(_: number, m: ChatMessage): number | string {
    return m.id ?? m.created_at ?? _;
  }
}
