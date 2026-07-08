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
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDatabase, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { Subscription, finalize } from 'rxjs';
import { AiChatService } from './services/ai-chat.service';
import { DfUserDataService } from 'src/app/shared/services/df-user-data.service';
import { DfScopeService } from 'src/app/shared/services/df-scope.service';
import { normalizeError } from 'src/app/shared/utilities/app-error';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { ChatMessage, ChatService, ChatSession } from './types/chat';
import { ProviderRates } from 'src/app/adf-ai-usage/types/usage';
import { DEFAULT_RATES } from 'src/app/adf-ai-usage/utils/cost';
import { DfChatInputComponent } from './components/df-chat-input/df-chat-input.component';
import { DfChatMessageComponent } from './components/df-chat-message/df-chat-message.component';
import { DfChatSessionListComponent } from './components/df-chat-session-list/df-chat-session-list.component';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { DfBadgeComponent } from 'src/app/shared/components/df-badge/df-badge.component';

/** One resolved reach chip for the "act as role" header. */
interface ActAsScopeChip {
  label: string;
  inherited: boolean;
}

@Component({
  selector: 'df-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
    DfChatInputComponent,
    DfChatMessageComponent,
    DfChatSessionListComponent,
    DfEmptyStateComponent,
    DfBadgeComponent,
  ],
  templateUrl: './df-ai-chat.component.html',
  styleUrls: ['./df-ai-chat.component.scss'],
})
export class DfAiChatComponent implements OnInit, OnDestroy {
  private api = inject(AiChatService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private userDataService = inject(DfUserDataService);
  private scope = inject(DfScopeService);

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

  // "Act as role": admins only. Lets an admin start a conversation scoped to a
  // specific role and see exactly what that role sees. End users always run
  // under their own login role — they never see this control. Blank = the
  // admin's own (unrestricted) access.
  isSysAdmin = false;
  actAsRoles: { id: number; name: string }[] = [];
  selectedActAsRoleId: number | null = null;
  // Resolved reach for the currently picked "act as" role, shown as header
  // chips so the boundary is visible before a single message is sent.
  actAsScopeChips: ActAsScopeChip[] = [];

  // Provider rate + model for the selected chat service's connection. Drives
  // the per-message cost chip. Null rate => no cost chip (honest omission).
  chatRate: ProviderRates | null = null;
  chatModel?: string;

  faDatabase = faDatabase;
  faUserShield = faUserShield;

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlightSends = 0;
  private subs: Subscription[] = [];
  private optimisticIdCounter = -1;
  private autoScrollPinned = true;

  ngOnInit(): void {
    // Only sys admins get the "Act as role" control; for them, load the roles
    // they can impersonate. End users are always scoped to their own login
    // role by the backend and never see this.
    this.subs.push(
      this.userDataService.userData$.subscribe(userData => {
        this.isSysAdmin = userData?.isSysAdmin === true;
        if (this.isSysAdmin && this.actAsRoles.length === 0) {
          this.http
            .get<{
              resource: { id: number; name: string }[];
            }>(`${BASE_URL}/system/role`, {
              params: { fields: 'id,name', sort: 'name' },
            })
            .subscribe({
              next: res => (this.actAsRoles = res.resource ?? []),
              error: () => {
                /* non-fatal: no act-as options */
              },
            });
        }
      })
    );

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
    this.chatRate = null;
    this.chatModel = undefined;
    this.resolveRate(name);
    this.loadSessions();
  }

  /**
   * Resolve the provider rate for a chat service's connection so the chat can
   * price each assistant turn the SAME way the usage dashboard does: the
   * connection's own cost_per_1k when configured, else the provider's default
   * rate. Never fabricates — if neither resolves, chatRate stays null and the
   * cost chip is omitted per message.
   */
  private resolveRate(serviceName: string): void {
    const svc = this.chatServices.find(s => s.name === serviceName);
    if (!svc) {
      return;
    }
    this.http
      .get<{ config?: { ai_service_id?: number } }>(
        `${BASE_URL}/system/service/${svc.id}`
      )
      .subscribe({
        next: chatSvc => {
          const aiId = chatSvc.config?.ai_service_id;
          if (aiId == null) {
            return;
          }
          this.http
            .get<{
              config?: {
                provider?: string;
                default_model?: string;
                cost_per_1k_input?: number | null;
                cost_per_1k_output?: number | null;
              };
            }>(`${BASE_URL}/system/service/${aiId}`)
            .subscribe({
              next: conn => {
                const c = conn.config ?? {};
                this.chatModel = c.default_model;
                if (
                  c.cost_per_1k_input != null &&
                  c.cost_per_1k_output != null
                ) {
                  this.chatRate = {
                    provider: c.provider ?? 'custom',
                    inputPer1k: c.cost_per_1k_input,
                    outputPer1k: c.cost_per_1k_output,
                  };
                } else if (c.provider && DEFAULT_RATES[c.provider]) {
                  this.chatRate = DEFAULT_RATES[c.provider];
                }
                this.cdr.markForCheck();
              },
              error: () => {
                /* non-fatal: no cost chip, tokens/latency still show */
              },
            });
        },
        error: () => {
          /* non-fatal: no cost chip */
        },
      });
  }

  /** Admin picked a different "act as" role: refresh the header scope chips
   *  so the resolved reach is visible before starting the chat. */
  onActAsRoleChange(): void {
    const roleId = this.selectedActAsRoleId;
    if (roleId == null) {
      this.actAsScopeChips = [];
      return;
    }
    this.scope.reachForRole(roleId).subscribe({
      next: entries => {
        // Collapse (service, component) grants to one chip per service, and
        // mark the chip inherited only when EVERY grant on it was inherited.
        const byService = new Map<string, ActAsScopeChip>();
        for (const e of entries) {
          if (!e.allow) {
            continue;
          }
          const existing = byService.get(e.serviceName);
          if (existing) {
            existing.inherited = existing.inherited && e.source === 'inherited';
          } else {
            byService.set(e.serviceName, {
              label: e.serviceLabel || e.serviceName,
              inherited: e.source === 'inherited',
            });
          }
        }
        this.actAsScopeChips = Array.from(byService.values()).sort((a, b) =>
          a.label.localeCompare(b.label)
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.actAsScopeChips = [];
      },
    });
  }

  /** Regenerate an assistant turn: re-send the user message that produced it.
   *  The backend always appends a fresh turn, so this asks the same question
   *  again rather than editing history in place. */
  regenerateFrom(assistant: ChatMessage): void {
    const msgs = this.messages;
    const idx = msgs.indexOf(assistant);
    for (let i = idx - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && msgs[i].content) {
        this.send(msgs[i].content as string);
        return;
      }
    }
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

  goToCreateService(): void {
    this.router.navigate(['/ai/chat-services/create']);
  }

  newChat(): void {
    if (!this.selectedServiceName) {
      return;
    }
    this.errorMessage = null;
    // Admins may start the conversation "as" a role (down-scoping only). End
    // users send nothing here — the backend binds them to their own role.
    const payload =
      this.isSysAdmin && this.selectedActAsRoleId != null
        ? { ai_role_id: this.selectedActAsRoleId }
        : {};
    this.api.createSession(this.selectedServiceName, payload).subscribe({
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
        // Skip the reassignment when the payload hasn't changed since the
        // last tick — otherwise every 1s poll replaces activeSession and
        // rebuilds this.sessions, forcing the whole transcript through
        // change detection for nothing.
        if (this.sessionUnchanged(this.activeSession, session)) {
          return;
        }
        this.activeSession = session;
        // Keep the sidebar entry in sync so its stats (tool-call count,
        // token totals, title) reflect the just-completed turn — otherwise
        // it keeps its creation-time zeros.
        this.sessions = this.sessions.map(s =>
          s.id === sessionId ? { ...s, ...session } : s
        );
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
    // AppError rethrown by the error interceptor, a raw Error, or a string;
    // normalizeError handles all of them and never yields '[object Object]'.
    return normalizeError(err).message;
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

  trackServiceName(_: number, s: ChatService): string {
    return s.name;
  }

  trackRoleId(_: number, r: { id: number }): number {
    return r.id;
  }

  /** Cheap same-payload check for the poll loop: message count, session
   *  timestamp, and the tail message's content/tool-call count. Anything
   *  the assistant streams in changes at least one of these. */
  private sessionUnchanged(prev: ChatSession, next: ChatSession): boolean {
    const prevMsgs = prev.messages ?? [];
    const nextMsgs = next.messages ?? [];
    if (prevMsgs.length !== nextMsgs.length) {
      return false;
    }
    if (prev.updated_at !== next.updated_at || prev.title !== next.title) {
      return false;
    }
    const a = prevMsgs[prevMsgs.length - 1];
    const b = nextMsgs[nextMsgs.length - 1];
    return (
      (a?.content ?? '') === (b?.content ?? '') &&
      (a?.tool_calls?.length ?? 0) === (b?.tool_calls?.length ?? 0)
    );
  }
}
