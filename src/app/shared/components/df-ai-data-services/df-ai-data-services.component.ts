import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { forkJoin } from 'rxjs';
import { BASE_URL } from 'src/app/shared/constants/urls';

interface ServiceRow {
  id: number;
  name: string;
  label?: string;
  type: string;
}

interface ServiceTypeRow {
  name: string;
  group?: string;
}

// Service-type groups whose services are queryable "data" for the AI.
const DATA_GROUPS = new Set(['Database', 'Big Data', 'File', 'Excel']);

@Component({
  selector: 'df-ai-data-services',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="data-services">
      <div class="data-services__header">
        <fa-icon [icon]="faDatabase" class="data-services__icon"></fa-icon>
        <span class="data-services__title">Data Services</span>
        <span class="data-services__count">
          {{ selected.length }} selected · {{ services.length }} available
        </span>
      </div>

      <p class="data-services__hint">
        Pick the databases the AI may query. The AI sees the intersection of
        these and what the caller's role can read. Leave all unselected to allow
        every data service the role grants.
      </p>

      <div *ngIf="loading" class="data-services__loading">
        Loading data services…
      </div>

      <ul *ngIf="!loading && services.length > 0" class="data-services__list">
        <li *ngFor="let s of services; trackBy: trackByName">
          <button
            type="button"
            class="data-services__chip"
            [class.data-services__chip--selected]="isSelected(s.name)"
            (click)="toggle(s.name)">
            <fa-icon
              *ngIf="isSelected(s.name)"
              [icon]="faCircleCheck"
              class="data-services__chip-check"></fa-icon>
            <span class="data-services__name">{{ s.label || s.name }}</span>
          </button>
        </li>
      </ul>

      <p *ngIf="!loading && services.length === 0" class="data-services__empty">
        No database services exist yet. Create one under API Generation &amp;
        Connections and come back.
      </p>
    </div>
  `,
  styles: [
    `
      /* Departure treatment: token-only chrome (light/dark/phosphor come
         free); selection chips ride the shared accent + corner scale so
         all the df-ai-* pickers read as one product. */
      .data-services {
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
          padding: 0.5rem 1rem;
          background: var(--df-surface);
          border: 1px solid var(--df-border);
          border-radius: var(--df-radius-sm);
          font: inherit;
          font-size: 1.4rem;
          color: inherit;
          cursor: pointer;
          transition:
            border-color 120ms ease,
            background 120ms ease;

          &:hover {
            border-color: var(--df-accent);
            background: var(--df-hover);
          }

          &--selected {
            border-color: var(--df-accent);
            background: var(--df-accent-soft);
            color: var(--df-text);
          }
        }

        &__chip-check {
          color: var(--df-accent);
        }

        &__name {
          font-weight: 500;
        }
      }
    `,
  ],
})
export class DfAiDataServicesComponent implements OnInit {
  /** Service form. Reads/writes config.defaultDataServices as a JSON array of
   *  data-service NAMES (strings). */
  @Input({ required: true }) form!: FormGroup;

  private http = inject(HttpClient);

  loading = true;
  services: ServiceRow[] = [];

  faDatabase = faDatabase;
  faCircleCheck = faCircleCheck;

  ngOnInit(): void {
    // Join service types (for their group) with the service catalog so we only
    // offer genuine data connectors, not AI/admin/utility services.
    forkJoin({
      types: this.http.get<{ resource: ServiceTypeRow[] }>(
        `${BASE_URL}/system/service_type`,
        { params: { fields: 'name,group' } }
      ),
      services: this.http.get<{ resource: ServiceRow[] }>(
        `${BASE_URL}/system/service`,
        { params: { fields: 'id,name,label,type', sort: 'name' } }
      ),
    }).subscribe({
      next: ({ types, services }) => {
        const dataTypes = new Set(
          (types.resource ?? [])
            .filter(t => DATA_GROUPS.has(t.group ?? ''))
            .map(t => t.name)
        );
        this.services = (services.resource ?? []).filter(s =>
          dataTypes.has(s.type)
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get selected(): string[] {
    return this.parse(this.form.get('config.defaultDataServices')?.value);
  }

  isSelected(name: string): boolean {
    return this.selected.includes(name);
  }

  toggle(name: string): void {
    const cur = this.selected;
    const next = cur.includes(name)
      ? cur.filter(x => x !== name)
      : [...cur, name];
    this.form.get('config.defaultDataServices')?.setValue(next);
  }

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

  trackByName(_: number, s: ServiceRow): string {
    return s.name;
  }
}
