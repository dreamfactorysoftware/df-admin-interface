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
        <li *ngFor="let r of roles; trackBy: trackById">
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
      /* Departure treatment: token-only chrome (light/dark/phosphor come
         free); selection chips ride the shared accent + corner scale so
         all the df-ai-* pickers read as one product. Warning amber is
         aliased locally per theme (no global --df-warning in light/dark);
         phosphor's token wins by construction. */
      .allowed-roles {
        --roles-warning: #9a5b00;
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

        &__warn {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.875rem 1.125rem;
          background: color-mix(
            in srgb,
            var(--df-warning, var(--roles-warning)) 10%,
            transparent
          );
          border: 1px solid
            color-mix(
              in srgb,
              var(--df-warning, var(--roles-warning)) 40%,
              transparent
            );
          border-radius: var(--df-radius-sm);
          color: var(--df-warning, var(--roles-warning));
          font-size: 1.3rem;
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

        &__link {
          font-size: 1.2rem;
          color: var(--df-text-muted);
          text-decoration: none;

          &:hover {
            color: var(--df-accent);
            text-decoration: underline;
          }
        }
      }

      :host-context(.dark-theme) .allowed-roles {
        --roles-warning: #ffb74d;
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

  trackById(_: number, r: RoleRow): number {
    return r.id;
  }
}
