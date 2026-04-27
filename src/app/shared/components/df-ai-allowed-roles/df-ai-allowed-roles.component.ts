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
      .allowed-roles {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem 1.5rem;
        margin: 0.5rem 0;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;

        &__header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-wrap: wrap;
        }

        &__icon {
          color: #a78bfa;
          font-size: 1.05rem;
        }

        &__title {
          font-weight: 600;
          font-size: 1rem;
        }

        &__count {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.55);
        }

        &__action {
          margin-left: auto;
          display: inline-flex !important;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem !important;
          padding: 0 0.75rem !important;
          min-height: 32px !important;
        }

        &__hint {
          margin: 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
        }

        &__warn {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 4px;
          color: #fbbf24;
          font-size: 0.875rem;
        }

        &__loading,
        &__empty {
          color: rgba(255, 255, 255, 0.55);
          font-style: italic;
          font-size: 0.875rem;
        }

        &__list {
          list-style: none;
          margin: 0.25rem 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 0.625rem;

          li {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
        }

        &__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.95rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          font: inherit;
          font-size: 0.95rem;
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
            color: #fff;
          }
        }

        &__chip-check {
          color: #c4b5fd;
        }

        &__name {
          font-weight: 500;
        }

        &__link {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
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
