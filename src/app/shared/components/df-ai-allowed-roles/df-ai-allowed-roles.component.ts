import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faShieldHalved,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoModule } from '@ngneat/transloco';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BASE_URL } from 'src/app/shared/constants/urls';
import { DfScopeMapComponent } from '../df-scope-map/df-scope-map.component';
import {
  DfPickerListComponent,
  PickerId,
  PickerItem,
} from '../df-picker-list/df-picker-list.component';

interface RoleRow {
  id: number;
  name: string;
  description?: string;
}

const toItem = (r: RoleRow): PickerItem => ({
  id: r.id,
  label: r.name,
  hint: r.description,
});

@Component({
  selector: 'df-ai-allowed-roles',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    FontAwesomeModule,
    TranslocoModule,
    DfScopeMapComponent,
    DfPickerListComponent,
  ],
  template: `
    <div class="allowed-roles" *transloco="let t; read: 'aiAllowedRoles'">
      <div class="allowed-roles__header">
        <fa-icon [icon]="faShieldHalved" class="allowed-roles__icon"></fa-icon>
        <span class="allowed-roles__title">{{ t('title') }}</span>
        <span class="allowed-roles__count">
          {{
            t('count', {
              selected: selected.length,
              available: total ?? roles.length,
            })
          }}
        </span>
        <a
          mat-stroked-button
          [routerLink]="['/api-connections/role-based-access/create']"
          class="allowed-roles__action">
          <fa-icon [icon]="faPlus"></fa-icon>
          <span>{{ t('createRole') }}</span>
        </a>
      </div>

      <p class="allowed-roles__hint">{{ t('hint') }}</p>

      <div
        *ngIf="selected.length === 0 && !loading"
        class="allowed-roles__warn">
        <fa-icon [icon]="faTriangleExclamation"></fa-icon>
        <span>{{ t('noneWarning') }}</span>
      </div>

      <div *ngIf="loading" class="allowed-roles__loading">
        {{ t('loading') }}
      </div>

      <df-picker-list
        *ngIf="!loading && roles.length > 0"
        noun="roles"
        testId="allowed-roles"
        [items]="items"
        [selected]="selected"
        [truncated]="truncated"
        [remoteSearch]="searchRoles"
        (toggle)="toggle($event)"></df-picker-list>

      <p *ngIf="!loading && roles.length === 0" class="allowed-roles__empty">
        {{ t('empty') }}
      </p>

      <section
        *ngIf="!loading && selectedRoles.length > 0"
        class="allowed-roles__reach">
        <div class="allowed-roles__reach-head">
          <fa-icon [icon]="faShieldHalved"></fa-icon>
          <span>{{ t('reachTitle') }}</span>
        </div>
        <p class="allowed-roles__hint">{{ t('reachHint') }}</p>
        <div
          *ngFor="let r of selectedRoles; trackBy: trackById"
          class="allowed-roles__reach-role">
          <div class="allowed-roles__reach-role-name">
            {{ t('reachRole', { role: r.name }) }}
          </div>
          <df-scope-map [roleId]="r.id"></df-scope-map>
        </div>
      </section>
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

        &__reach {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--df-border-2);
        }

        &__reach-head {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-weight: 600;
          font-size: 1.4rem;
          letter-spacing: -0.01em;

          fa-icon {
            color: var(--df-accent);
            font-size: 1.6rem;
          }
        }

        &__reach-role {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        &__reach-role-name {
          font-weight: 600;
          font-size: 1.3rem;
          color: var(--df-text-2);
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
  items: PickerItem[] = [];
  /** meta.count from the load; null until known. */
  total: number | null = null;
  /** True when the server capped the load, so the picker also searches server-side. */
  truncated = false;
  /** Roles found through server-side search, so a picked one can still be shown. */
  private found = new Map<number, RoleRow>();

  faShieldHalved = faShieldHalved;
  faPlus = faPlus;
  faTriangleExclamation = faTriangleExclamation;

  ngOnInit(): void {
    this.http
      .get<{ resource: RoleRow[]; meta?: { count?: number } }>(
        `${BASE_URL}/system/role`,
        {
          params: {
            fields: 'id,name,description',
            sort: 'name',
            include_count: 'true',
          },
        }
      )
      .subscribe({
        next: res => {
          this.roles = res.resource ?? [];
          this.items = this.roles.map(toItem);
          const total = res.meta?.count ?? this.roles.length;
          this.total = total;
          this.truncated = total > this.roles.length;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  /** Server-side role search for instances whose role list exceeded the load cap. */
  searchRoles = (query: string): Observable<PickerItem[]> =>
    this.http
      .get<{ resource: RoleRow[] }>(`${BASE_URL}/system/role`, {
        params: {
          fields: 'id,name,description',
          sort: 'name',
          limit: '50',
          filter: `name like "%${query.replace(/["\\%]/g, '')}%"`,
        },
      })
      .pipe(
        map(res => res.resource ?? []),
        tap(rows => rows.forEach(r => this.found.set(r.id, r))),
        map(rows => rows.map(toItem))
      );

  /** Read the current allowed_roles list from the form, normalized to numbers. */
  get selected(): number[] {
    const raw = this.form.get('config.allowedRoles')?.value;
    return this.parse(raw);
  }

  isSelected(id: number): boolean {
    return this.selected.includes(id);
  }

  /** The role records currently attached to this AI connection, in list order.
   *  Each renders an inline df-scope-map so the resolved reach is visible in
   *  place instead of behind a link. */
  get selectedRoles(): RoleRow[] {
    const ids = this.selected;
    const known = new Map<number, RoleRow>(this.found);
    this.roles.forEach(r => known.set(r.id, r));
    return ids
      .map(id => known.get(id))
      .filter((r): r is RoleRow => r !== undefined);
  }

  toggle(id: PickerId): void {
    const roleId = Number(id);
    const cur = this.selected;
    const next = cur.includes(roleId)
      ? cur.filter(x => x !== roleId)
      : [...cur, roleId];
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
