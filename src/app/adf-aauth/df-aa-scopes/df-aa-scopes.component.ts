import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfEmptyStateComponent } from 'src/app/shared/components/df-empty-state/df-empty-state.component';
import { ROUTES } from 'src/app/shared/types/routes';
import { AauthStore } from '../aauth.store';
import { AauthScope } from '../aauth.types';

type EditField = 'scope' | 'description';

/**
 * Scopes: every DreamFactory role, and the scope name agents ask for to
 * get it. Scope and description edit in place (Enter or blur saves,
 * Escape cancels).
 */
@Component({
  selector: 'df-aa-scopes',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    TranslocoPipe,
    DfEmptyStateComponent,
  ],
  templateUrl: './df-aa-scopes.component.html',
  styleUrls: ['./df-aa-scopes.component.scss'],
})
export class DfAaScopesComponent {
  readonly store = inject(AauthStore);
  private router = inject(Router);

  query = '';
  editing: { roleId: number; field: EditField } | null = null;
  draft = '';

  @ViewChild('editInput') set editInput(el: ElementRef<HTMLInputElement>) {
    if (el) {
      el.nativeElement.focus();
      el.nativeElement.select();
    }
  }

  get rows(): AauthScope[] {
    const byId = new Map((this.store.scopes ?? []).map(s => [s.roleId, s]));
    const ordered = this.store.scopeOrder
      .map(id => byId.get(id))
      .filter((s): s is AauthScope => !!s);
    // Roles that appeared after the order was fixed go last.
    for (const s of this.store.scopes ?? []) {
      if (!this.store.scopeOrder.includes(s.roleId)) ordered.push(s);
    }
    const q = this.query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter(s =>
      [s.roleName, s.scope, s.description ?? '', s.roleDescription ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  isEditing(s: AauthScope, field: EditField): boolean {
    return this.editing?.roleId === s.roleId && this.editing.field === field;
  }

  edit(s: AauthScope, field: EditField): void {
    this.editing = { roleId: s.roleId, field };
    this.draft = (field === 'scope' ? s.scope : s.description) ?? '';
  }

  cancel(): void {
    this.editing = null;
  }

  commit(s: AauthScope): void {
    const e = this.editing;
    if (!e || e.roleId !== s.roleId) return;
    const current = (e.field === 'scope' ? s.scope : s.description) ?? '';
    const next = this.draft.trim();
    if (next === current.trim()) {
      this.editing = null;
      return;
    }
    const ok =
      e.field === 'scope'
        ? this.store.updateScope(s.roleId, { scope: next })
        : this.store.updateScope(s.roleId, { description: next || null });
    if (ok) this.editing = null;
  }

  toggle(s: AauthScope, enabled: boolean): void {
    this.store.updateScope(s.roleId, { enabled });
  }

  openRoles(): void {
    this.router.navigate([
      `/${ROUTES.API_CONNECTIONS}/${ROUTES.ROLE_BASED_ACCESS}`,
    ]);
  }

  trackRole = (_: number, s: AauthScope) => s.roleId;
}
