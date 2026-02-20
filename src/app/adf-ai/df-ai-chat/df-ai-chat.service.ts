import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_URL } from '../../shared/constants/urls';
import {
  DataChatConfig,
  DataChatRequest,
  DataChatResponse,
  ServiceInfo,
} from './df-ai-chat.types';

@Injectable({ providedIn: 'root' })
export class DfAiChatService {
  constructor(private http: HttpClient) {}

  /** List all AI Connection services. */
  getAiServices(): Observable<{ resource: ServiceInfo[] }> {
    return this.http.get<{ resource: ServiceInfo[] }>(
      `${BASE_URL}/system/service`,
      { params: { filter: 'type=ai_connection', fields: 'id,name,label,type' } }
    );
  }

  /** Get data chat config for an AI service. */
  getConfig(serviceName: string): Observable<DataChatConfig> {
    return this.http.get<DataChatConfig>(`${BASE_URL}/${serviceName}/data-chat`);
  }

  /** Send a chat message and get the agentic response. */
  chat(serviceName: string, request: DataChatRequest): Observable<DataChatResponse> {
    return this.http.post<DataChatResponse>(
      `${BASE_URL}/${serviceName}/data-chat`,
      request
    );
  }
}
