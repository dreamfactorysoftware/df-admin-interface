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
        <li *ngFor="let s of services">
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
      .data-services {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem 1.75rem;
        margin: 1rem 0;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        font-size: 16px;

        &__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        &__icon {
          color: #4ade80;
          font-size: 20px;
        }

        &__title {
          font-weight: 600;
          font-size: 18px;
        }

        &__count {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
        }

        &__hint {
          margin: 0;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.55;
        }

        &__loading,
        &__empty {
          color: rgba(255, 255, 255, 0.6);
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
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          font: inherit;
          font-size: 16px;
          color: inherit;
          cursor: pointer;
          transition:
            border-color 120ms ease,
            background 120ms ease;

          &:hover {
            border-color: rgba(74, 222, 128, 0.6);
            background: rgba(74, 222, 128, 0.08);
          }

          &--selected {
            border-color: #4ade80;
            background: rgba(74, 222, 128, 0.18);
            color: #fff;
          }
        }

        &__chip-check {
          color: #86efac;
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
}
