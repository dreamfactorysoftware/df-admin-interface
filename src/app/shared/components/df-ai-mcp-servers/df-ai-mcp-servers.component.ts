import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faPlug } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BASE_URL } from 'src/app/shared/constants/urls';
import {
  DfPickerListComponent,
  PickerId,
  PickerItem,
} from '../df-picker-list/df-picker-list.component';

interface McpServerRow {
  id: number;
  name: string;
  label?: string;
}

const toItem = (s: McpServerRow): PickerItem => ({
  id: s.name,
  label: s.label || s.name,
  hint: s.label ? s.name : undefined,
});

@Component({
  selector: 'df-ai-mcp-servers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    FontAwesomeModule,
    DfPickerListComponent,
  ],
  template: `
    <div class="mcp-servers">
      <div class="mcp-servers__header">
        <fa-icon [icon]="faPlug" class="mcp-servers__icon"></fa-icon>
        <span class="mcp-servers__title">MCP Servers</span>
        <span class="mcp-servers__count">
          {{ selected.length }} selected · {{ servers.length }} available
        </span>
        <a
          mat-stroked-button
          [routerLink]="['/api-connections/api-types/database']"
          class="mcp-servers__action">
          <fa-icon [icon]="faPlus"></fa-icon>
          <span>Create MCP service</span>
        </a>
      </div>

      <p class="mcp-servers__hint">
        Pick the MCP servers this chat may call as tools. The AI sees the
        intersection of these and what the caller's role can access, so a
        conversation can never reach a server the person talking to it can't.
        Leave all unselected to allow every MCP server the role grants.
      </p>

      <div *ngIf="loading" class="mcp-servers__loading">
        Loading MCP servers…
      </div>

      <df-picker-list
        *ngIf="!loading && servers.length > 0"
        noun="MCP servers"
        testId="mcp-servers"
        [items]="items"
        [selected]="selected"
        [truncated]="truncated"
        [remoteSearch]="searchServers"
        (toggle)="toggle($event)"></df-picker-list>

      <p *ngIf="!loading && servers.length === 0" class="mcp-servers__empty">
        No MCP services exist yet. Create one (service type “MCP Server”) and
        come back.
      </p>
    </div>
  `,
  styles: [
    `
      /* Departure treatment: token-only chrome (light/dark/phosphor come
         free); selection chips ride the shared accent + corner scale so
         all the df-ai-* pickers read as one product. */
      .mcp-servers {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem 1.75rem;
        margin: 1rem 0;
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        border-radius: var(--df-radius);
        font-size: 1.4rem;
        color: var(--df-text);

        &__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        &__icon {
          color: var(--df-accent);
          font-size: 1.8rem;
        }

        &__title {
          font-weight: 600;
          font-size: 1.5rem;
          letter-spacing: -0.01em;
        }

        &__count {
          font-size: 1.3rem;
          color: var(--df-text-muted);
        }

        &__action {
          margin-left: auto;
          display: inline-flex !important;
          align-items: center;
          gap: 0.4rem;
          font-size: 1.3rem !important;
          padding: 0 0.875rem !important;
          min-height: 38px !important;
        }

        &__hint {
          margin: 0;
          font-size: 1.3rem;
          color: var(--df-text-2);
          line-height: 1.55;
        }

        &__loading,
        &__empty {
          color: var(--df-text-muted);
          font-style: italic;
          font-size: 1.3rem;
        }
      }
    `,
  ],
})
export class DfAiMcpServersComponent implements OnInit {
  /** Service form. Reads/writes config.mcpServers as a JSON array of MCP
   *  service NAMES (strings, not ids). */
  @Input({ required: true }) form!: FormGroup;

  private http = inject(HttpClient);

  loading = true;
  servers: McpServerRow[] = [];
  items: PickerItem[] = [];
  /** True when the server capped the load; the picker then searches server-side. */
  truncated = false;

  faPlug = faPlug;
  faPlus = faPlus;

  ngOnInit(): void {
    this.http
      .get<{ resource: McpServerRow[]; meta?: { count?: number } }>(
        `${BASE_URL}/system/service`,
        {
          params: {
            filter: 'type = "mcp"',
            fields: 'id,name,label',
            sort: 'name',
            include_count: 'true',
          },
        }
      )
      .subscribe({
        next: res => {
          this.servers = res.resource ?? [];
          this.items = this.servers.map(toItem);
          this.truncated =
            (res.meta?.count ?? this.servers.length) > this.servers.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  /** Server-side search for instances whose MCP list exceeded the load cap. */
  searchServers = (query: string): Observable<PickerItem[]> => {
    const q = query.replace(/["\\%]/g, '');
    return this.http
      .get<{ resource: McpServerRow[] }>(`${BASE_URL}/system/service`, {
        params: {
          fields: 'id,name,label',
          sort: 'name',
          limit: '50',
          filter: `(type = "mcp") and ((name like "%${q}%") or (label like "%${q}%"))`,
        },
      })
      .pipe(map(res => (res.resource ?? []).map(toItem)));
  };

  /** Current mcp_servers list from the form, normalized to service names. */
  get selected(): string[] {
    return this.parse(this.form.get('config.mcpServers')?.value);
  }

  isSelected(name: string): boolean {
    return this.selected.includes(name);
  }

  toggle(id: PickerId): void {
    const name = String(id);
    const cur = this.selected;
    const next = cur.includes(name)
      ? cur.filter(x => x !== name)
      : [...cur, name];
    this.form.get('config.mcpServers')?.setValue(next);
  }

  /** Backend stores mcp_servers as JSON. The form may hand it back already
   *  decoded (array) or still as a JSON string — handle both. */
  private parse(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw.map(String).filter(s => s.length > 0);
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(String).filter(s => s.length > 0);
        }
      } catch {
        return [];
      }
    }
    return [];
  }

  trackByName(_: number, s: McpServerRow): string {
    return s.name;
  }
}
