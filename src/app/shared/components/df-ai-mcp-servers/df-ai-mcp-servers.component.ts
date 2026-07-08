import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faPlus,
  faPlug,
} from '@fortawesome/free-solid-svg-icons';
import { BASE_URL } from 'src/app/shared/constants/urls';

interface McpServerRow {
  id: number;
  name: string;
  label?: string;
}

@Component({
  selector: 'df-ai-mcp-servers',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, FontAwesomeModule],
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

      <div *ngIf="loading" class="mcp-servers__loading">Loading MCP servers…</div>

      <ul *ngIf="!loading && servers.length > 0" class="mcp-servers__list">
        <li *ngFor="let s of servers; trackBy: trackByName">
          <button
            type="button"
            class="mcp-servers__chip"
            [class.mcp-servers__chip--selected]="isSelected(s.name)"
            (click)="toggle(s.name)">
            <fa-icon
              *ngIf="isSelected(s.name)"
              [icon]="faCircleCheck"
              class="mcp-servers__chip-check"></fa-icon>
            <span class="mcp-servers__name">{{ s.label || s.name }}</span>
          </button>
        </li>
      </ul>

      <p *ngIf="!loading && servers.length === 0" class="mcp-servers__empty">
        No MCP services exist yet. Create one (service type “MCP Server”) and come
        back.
      </p>
    </div>
  `,
  styles: [
    `
      /* Themed via global --df-* tokens (src/styles.scss); dark values come
         from the .dark-theme class DfThemeService stamps on <body>. */
      .mcp-servers {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem 1.75rem;
        margin: 1rem 0;
        background: var(--df-surface-2);
        border: 1px solid var(--df-border-2);
        border-radius: 8px;
        font-size: 16px;

        &__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        &__icon {
          color: #2dd4bf;
          font-size: 20px;
        }

        &__title {
          font-weight: 600;
          font-size: 18px;
        }

        &__count {
          font-size: 15px;
          color: var(--df-text-muted);
        }

        &__action {
          margin-left: auto;
          display: inline-flex !important;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem !important;
          padding: 0 0.875rem !important;
          min-height: 38px !important;
        }

        &__hint {
          margin: 0;
          font-size: 15px;
          color: var(--df-text-2);
          line-height: 1.55;
        }

        &__loading,
        &__empty {
          color: var(--df-text-muted);
          font-style: italic;
          font-size: 15px;
        }

        &__list {
          list-style: none;
          margin: 0.25rem 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem 0.75rem;

          li {
            display: inline-flex;
            align-items: center;
            gap: 0.625rem;
          }
        }

        &__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.05rem;
          background: var(--df-hover);
          border: 1px solid var(--df-border);
          border-radius: 999px;
          font: inherit;
          font-size: 16px;
          color: inherit;
          cursor: pointer;
          transition:
            border-color 120ms ease,
            background 120ms ease;

          &:hover {
            border-color: rgba(45, 212, 191, 0.6);
            background: rgba(45, 212, 191, 0.08);
          }

          &--selected {
            border-color: #2dd4bf;
            background: rgba(45, 212, 191, 0.18);
            color: var(--df-text);
          }
        }

        &__chip-check {
          color: #99f6e4;
        }

        &__name {
          font-weight: 500;
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

  faPlug = faPlug;
  faCircleCheck = faCircleCheck;
  faPlus = faPlus;

  ngOnInit(): void {
    this.http
      .get<{ resource: McpServerRow[] }>(`${BASE_URL}/system/service`, {
        params: { filter: 'type = "mcp"', fields: 'id,name,label', sort: 'name' },
      })
      .subscribe({
        next: res => {
          this.servers = res.resource ?? [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  /** Current mcp_servers list from the form, normalized to service names. */
  get selected(): string[] {
    return this.parse(this.form.get('config.mcpServers')?.value);
  }

  isSelected(name: string): boolean {
    return this.selected.includes(name);
  }

  toggle(name: string): void {
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
