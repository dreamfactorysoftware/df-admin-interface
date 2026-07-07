import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faCircleCheck,
  faPlus,
  faShieldHalved,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { BASE_URL } from 'src/app/shared/constants/urls';

interface RoleRow {
  id: number;
  name: string;
  description?: string;
}

@Component({
  selector: 'df-ai-allowed-roles',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, FontAwesomeModule],
  template: `
    <div class="allowed-roles">
      <div class="allowed-roles__header">
        <fa-icon [icon]="faShieldHalved" class="allowed-roles__icon"></fa-icon>
        <span class="allowed-roles__title">Allowed Roles</span>
        <span class="allowed-roles__count">
          {{ selected.length }} selected · {{ roles.length }} available
        </span>
        <a
          mat-stroked-button
          [routerLink]="['/api-connections/role-based-access/create']"
          class="allowed-roles__action">
          <fa-icon [icon]="faPlus"></fa-icon>
          <span>Create new role</span>
        </a>
      </div>

      <p class="allowed-roles__hint">
        Pick the DreamFactory roles that may use this AI Connection. Each role's
        data scope determines what the AI can read while operating under that
        role. At least one role is required before chat sessions can run.
      </p>

      <div
        *ngIf="selected.length === 0 && !loading"
        class="allowed-roles__warn">
        <fa-icon [icon]="faTriangleExclamation"></fa-icon>
        <span>
          No roles selected. Chat sessions will refuse to start until at least
          one role is allowed.
        </span>
      </div>

      <div *ngIf="loading" class="allowed-roles__loading">Loading roles…</div>

      <ul *ngIf="!loading && roles.length > 0" class="allowed-roles__list">
        <li *ngFor="let r of roles">
          <button
            type="button"
            class="allowed-roles__chip"
            [class.allowed-roles__chip--selected]="isSelected(r.id)"
            (click)="toggle(r.id)">
            <fa-icon
              *ngIf="isSelected(r.id)"
              [icon]="faCircleCheck"
              class="allowed-roles__chip-check"></fa-icon>
            <span class="allowed-roles__name">{{ r.name }}</span>
          </button>
          <a
            [routerLink]="['/api-connections/role-based-access', r.id, 'scope']"
            class="allowed-roles__link"
            >what can this role see?</a
          >
        </li>
      </ul>

      <p *ngIf="!loading && roles.length === 0" class="allowed-roles__empty">
        No DreamFactory roles exist yet. Create one and come back.
      </p>
    </div>
  `,
  styles: [
    `
      /* Themed via global --df-* tokens (src/styles.scss); dark values come
         from the .dark-theme class DfThemeService stamps on <body>. */
      .allowed-roles {
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
          color: #a78bfa;
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

        &__warn {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.875rem 1.125rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 4px;
          color: #fbbf24;
          font-size: 15px;
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
          border: 1px solid var(--df-border-2);
          border-radius: 999px;
          font: inherit;
          font-size: 16px;
          color: inherit;
          cursor: pointer;
          transition:
            border-color 120ms ease,
            background 120ms ease;

          &:hover {
            border-color: rgba(167, 139, 250, 0.6);
            background: rgba(167, 139, 250, 0.08);
          }

          &--selected {
            border-color: #a78bfa;
            background: rgba(167, 139, 250, 0.18);
            color: var(--df-text);
          }
        }

        &__chip-check {
          color: #c4b5fd;
        }

        &__name {
          font-weight: 500;
        }

        &__link {
          font-size: 14px;
          color: var(--df-text-muted);
          text-decoration: none;

          &:hover {
            color: #a78bfa;
            text-decoration: underline;
          }
        }
      }
    `,
  ],
})
export class DfAiAllowedRolesComponent implements OnInit {
  /** Service form. Reads/writes config.allowedRoles as a JSON array of role IDs. */
  @Input({ required: true }) form!: FormGroup;

  private http = inject(HttpClient);

  loading = true;
  roles: RoleRow[] = [];

  faShieldHalved = faShieldHalved;
  faCheck = faCheck;
  faCircleCheck = faCircleCheck;
  faPlus = faPlus;
  faTriangleExclamation = faTriangleExclamation;

  ngOnInit(): void {
    this.http
      .get<{ resource: RoleRow[] }>(`${BASE_URL}/system/role`, {
        params: { fields: 'id,name,description', sort: 'name' },
      })
      .subscribe({
        next: res => {
          this.roles = res.resource ?? [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  /** Read the current allowed_roles list from the form, normalized to numbers. */
  get selected(): number[] {
    const raw = this.form.get('config.allowedRoles')?.value;
    return this.parse(raw);
  }

  isSelected(id: number): boolean {
    return this.selected.includes(id);
  }

  toggle(id: number): void {
    const cur = this.selected;
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    this.form.get('config.allowedRoles')?.setValue(next);
  }

  /** Backend stores allowed_roles as JSON. Form may already have it parsed
   *  (camelCased + decoded by the case interceptor) or still as a JSON
   *  string — handle both. */
  private parse(raw: unknown): number[] {
    if (Array.isArray(raw)) {
      return raw.map(Number).filter(n => Number.isFinite(n));
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(Number).filter(n => Number.isFinite(n));
        }
      } catch {
        return [];
      }
    }
    return [];
  }
}
