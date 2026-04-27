import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faCircleExclamation,
  faPlus,
  faRobot,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BASE_URL } from 'src/app/shared/constants/urls';

interface AiConnectionRow {
  id: number;
  name: string;
  label?: string;
}

interface RoleRow {
  id: number;
  name: string;
}

@Component({
  selector: 'df-ai-chat-prereqs',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, FontAwesomeModule],
  template: `
    <div class="prereqs">
      <header class="prereqs__header">
        <h4>Before you save</h4>
        <p>
          An AI Chat service connects an AI Connection (the LLM provider) to
          a DreamFactory Role (the data scope). Both must exist first — copy
          their IDs into the form below.
        </p>
      </header>

      <section
        class="prereqs__section"
        [class.prereqs__section--missing]="!loading && connections.length === 0">
        <div class="prereqs__row">
          <fa-icon
            [icon]="connections.length ? faCheck : faCircleExclamation"
            class="prereqs__icon"
            [class.prereqs__icon--ok]="connections.length"
            [class.prereqs__icon--miss]="!connections.length"></fa-icon>
          <fa-icon [icon]="faRobot" class="prereqs__kind-icon"></fa-icon>
          <span class="prereqs__title">AI Connections</span>
          <span class="prereqs__count">
            <ng-container *ngIf="loading">loading…</ng-container>
            <ng-container *ngIf="!loading">
              {{ connections.length }} configured
            </ng-container>
          </span>
          <a
            mat-stroked-button
            [routerLink]="['/ai/connections/create']"
            class="prereqs__action">
            <fa-icon [icon]="faPlus"></fa-icon>
            <span>{{
              connections.length ? 'Add another' : 'Create one now'
            }}</span>
          </a>
        </div>

        <ul *ngIf="connections.length" class="prereqs__list">
          <li *ngFor="let c of connections" class="prereqs__item">
            <code class="prereqs__id">id = {{ c.id }}</code>
            <span class="prereqs__name">{{ c.label || c.name }}</span>
            <a
              [routerLink]="['/ai/connections', c.id]"
              class="prereqs__link"
              >view</a
            >
          </li>
        </ul>

        <p *ngIf="!loading && connections.length === 0" class="prereqs__hint">
          No AI Connections yet. The AI Chat service can't run without one —
          create one above and copy its <code>id</code> into the
          <strong>AI Service</strong> field below.
        </p>
      </section>

      <section
        class="prereqs__section"
        [class.prereqs__section--missing]="!loading && roles.length === 0">
        <div class="prereqs__row">
          <fa-icon
            [icon]="roles.length ? faCheck : faCircleExclamation"
            class="prereqs__icon"
            [class.prereqs__icon--ok]="roles.length"
            [class.prereqs__icon--miss]="!roles.length"></fa-icon>
          <fa-icon
            [icon]="faShieldHalved"
            class="prereqs__kind-icon"></fa-icon>
          <span class="prereqs__title">Roles</span>
          <span class="prereqs__count">
            <ng-container *ngIf="loading">loading…</ng-container>
            <ng-container *ngIf="!loading">
              {{ roles.length }} available
            </ng-container>
          </span>
          <a
            mat-stroked-button
            [routerLink]="['/api-connections/role-based-access/create']"
            class="prereqs__action">
            <fa-icon [icon]="faPlus"></fa-icon>
            <span>{{ roles.length ? 'Add another' : 'Create one now' }}</span>
          </a>
        </div>

        <ul *ngIf="roles.length" class="prereqs__list">
          <li *ngFor="let r of roles" class="prereqs__item">
            <code class="prereqs__id">id = {{ r.id }}</code>
            <span class="prereqs__name">{{ r.name }}</span>
            <a
              [routerLink]="[
                '/api-connections/role-based-access',
                r.id,
                'scope'
              ]"
              class="prereqs__link"
              >view scope</a
            >
          </li>
        </ul>

        <p *ngIf="!loading && roles.length === 0" class="prereqs__hint">
          No Roles configured. The AI operates under a Role that defines what
          data it can access — create a restricted role and copy its
          <code>id</code> into the <strong>AI Role</strong> field below.
        </p>
      </section>
    </div>
  `,
  styles: [
    `
      .prereqs {
        border: 1px solid rgba(96, 165, 250, 0.3);
        background: rgba(96, 165, 250, 0.05);
        border-radius: 8px;
        padding: 1.25rem 1.5rem;
        margin: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 1rem;

        &__header {
          h4 {
            margin: 0 0 0.25rem;
            font-size: 1rem;
            font-weight: 600;
          }
          p {
            margin: 0;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.875rem;
            line-height: 1.5;
          }
        }

        &__section {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.02);

          &--missing {
            background: rgba(220, 53, 69, 0.06);
            border: 1px solid rgba(220, 53, 69, 0.25);
          }
        }

        &__row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        &__icon {
          font-size: 1.05rem;

          &--ok {
            color: #4ade80;
          }
          &--miss {
            color: #ff6b6b;
          }
        }

        &__kind-icon {
          color: rgba(255, 255, 255, 0.5);
        }

        &__title {
          font-weight: 600;
          font-size: 0.95rem;
        }

        &__count {
          font-size: 0.8125rem;
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

        &__list {
          list-style: none;
          margin: 0.5rem 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        &__item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.625rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          font-size: 0.8125rem;
        }

        &__id {
          font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
          font-size: 0.75rem;
          color: #60a5fa;
        }

        &__name {
          font-weight: 500;
        }

        &__link {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          padding-left: 0.25rem;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          margin-left: 0.25rem;

          &:hover {
            color: #60a5fa;
          }
        }

        &__hint {
          margin: 0.5rem 0 0;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;

          code {
            font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
            font-size: 0.75rem;
            padding: 0.1rem 0.375rem;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.08);
          }

          strong {
            color: rgba(255, 255, 255, 0.9);
          }
        }
      }
    `,
  ],
})
export class DfAiChatPrereqsComponent implements OnInit {
  private http = inject(HttpClient);

  loading = true;
  connections: AiConnectionRow[] = [];
  roles: RoleRow[] = [];

  faCheck = faCheck;
  faCircleExclamation = faCircleExclamation;
  faPlus = faPlus;
  faRobot = faRobot;
  faShieldHalved = faShieldHalved;

  ngOnInit(): void {
    forkJoin({
      conn: this.http
        .get<{ resource: AiConnectionRow[] }>(`${BASE_URL}/system/service`, {
          params: {
            filter: 'type = "ai_connection"',
            fields: 'id,name,label',
            sort: 'name',
          },
        })
        .pipe(catchError(() => of({ resource: [] }))),
      roles: this.http
        .get<{ resource: RoleRow[] }>(`${BASE_URL}/system/role`, {
          params: { fields: 'id,name', sort: 'name' },
        })
        .pipe(catchError(() => of({ resource: [] }))),
    }).subscribe(({ conn, roles }) => {
      this.connections = conn.resource ?? [];
      this.roles = roles.resource ?? [];
      this.loading = false;
    });
  }
}
