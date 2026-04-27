import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';
import {
  ChatMessage,
  ChatSession,
  ChatService,
  CreateSessionPayload,
  SendMessageResponse,
} from '../types/chat';
import { GenericListResponse } from 'src/app/shared/types/generic-http';

interface SystemServiceListResponse {
  resource: ChatService[];
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private http = inject(HttpClient);

  /** List all configured ai_chat services. */
  listChatServices(): Observable<SystemServiceListResponse> {
    return this.http.get<SystemServiceListResponse>(
      `${BASE_URL}/system/service`,
      {
        params: {
          filter: 'type = "ai_chat"',
          fields: 'id,name,label,type,description,is_active',
          sort: 'name',
        },
      }
    );
  }

  /** List sessions for a chat service. */
  listSessions(
    serviceName: string,
    status: 'active' | 'archived' | 'all' = 'active'
  ): Observable<{ resource: ChatSession[] }> {
    return this.http.get<{ resource: ChatSession[] }>(
      `${BASE_URL}/${serviceName}/session`,
      { params: { status } }
    );
  }

  /** Get a single session with its messages. */
  getSession(
    serviceName: string,
    sessionId: number,
    messageLimit = 200
  ): Observable<ChatSession> {
    return this.http.get<ChatSession>(
      `${BASE_URL}/${serviceName}/session/${sessionId}`,
      { params: { message_limit: String(messageLimit) } }
    );
  }

  /** Create a new chat session. */
  createSession(
    serviceName: string,
    payload: CreateSessionPayload = {}
  ): Observable<ChatSession> {
    return this.http.post<ChatSession>(
      `${BASE_URL}/${serviceName}/session`,
      payload
    );
  }

  /** Send a message to a session. The backend runs the agentic tool loop
   *  and returns the final assistant message. Intermediate tool messages
   *  are persisted as they happen and become visible via getSession() polling. */
  sendMessage(
    serviceName: string,
    sessionId: number,
    message: string
  ): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(
      `${BASE_URL}/${serviceName}/session/${sessionId}`,
      { message }
    );
  }

  deleteSession(
    serviceName: string,
    sessionId: number
  ): Observable<unknown> {
    return this.http.delete(`${BASE_URL}/${serviceName}/session/${sessionId}`);
  }
}

// Re-export so consumers don't need to chase imports.
export type { ChatMessage, ChatSession, ChatService };
export type { GenericListResponse };
