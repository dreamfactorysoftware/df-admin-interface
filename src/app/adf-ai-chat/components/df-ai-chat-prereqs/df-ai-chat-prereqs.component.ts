import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faCircleCheck,
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
        <h4>AI Chat setup</h4>
        <p>
          An AI Chat service ties an AI Connection (the LLM) to a DreamFactory
          Role (the data scope). Pick one of each below — your selection writes
          straight into the form.
        </p>
      </header>

      <section
        class="prereqs__section"
        [class.prereqs__section--missing]="
          !loading && connections.length === 0
        ">
        <div class="prereqs__row">
          <fa-icon
            [icon]="connections.length ? faCheck : faCircleExclamation"
            class="prereqs__icon"
            [class.prereqs__icon--ok]="connections.length"
            [class.prereqs__icon--miss]="!connections.length"></fa-icon>
          <fa-icon [icon]="faRobot" class="prereqs__kind-icon"></fa-icon>
          <span class="prereqs__title">AI Connection</span>
          <span class="prereqs__count">
            <ng-container *ngIf="loading">loading…</ng-container>
            <ng-container *ngIf="!loading">
              {{ connections.length }} available
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

        <p
          *ngIf="connections.length && selectedConnectionId == null"
          class="prereqs__pick-hint">
          Click one to use it for this chat service:
        </p>
        <ul *ngIf="connections.length" class="prereqs__list">
          <li *ngFor="let c of connections">
            <button
              type="button"
              class="prereqs__chip"
              [class.prereqs__chip--selected]="c.id === selectedConnectionId"
              (click)="selectConnection.emit(c.id)">
              <fa-icon
                *ngIf="c.id === selectedConnectionId"
                [icon]="faCircleCheck"
                class="prereqs__chip-check"></fa-icon>
              <span class="prereqs__name">{{ c.label || c.name }}</span>
            </button>
          </li>
        </ul>

        <p *ngIf="!loading && connections.length === 0" class="prereqs__hint">
          No AI Connections yet. The chat service can't run without one — use
          the button above to create one, then come back.
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
          <fa-icon [icon]="faShieldHalved" class="prereqs__kind-icon"></fa-icon>
          <span class="prereqs__title">AI Role</span>
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

        <p
          *ngIf="roles.length && selectedRoleId == null"
          class="prereqs__pick-hint">
          Click one to scope the AI's data access:
        </p>
        <ul *ngIf="roles.length" class="prereqs__list">
          <li *ngFor="let r of roles">
            <button
              type="button"
              class="prereqs__chip"
              [class.prereqs__chip--selected]="r.id === selectedRoleId"
              (click)="selectRole.emit(r.id)">
              <fa-icon
                *ngIf="r.id === selectedRoleId"
                [icon]="faCircleCheck"
                class="prereqs__chip-check"></fa-icon>
              <span class="prereqs__name">{{ r.name }}</span>
            </button>
            <a
              [routerLink]="[
                '/api-connections/role-based-access',
                r.id,
                'scope',
              ]"
              class="prereqs__link"
              >what can this role see?</a
            >
          </li>
        </ul>

        <p *ngIf="!loading && roles.length === 0" class="prereqs__hint">
          No Roles configured. The AI operates under a Role that limits what
          data it can access. Create a restricted role and come back.
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
          margin: 0.625rem 0 0;
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
          padding: 0.4rem 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          font: inherit;
          font-size: 0.8125rem;
          color: inherit;
          cursor: pointer;
          transition:
            border-color 120ms ease,
            background 120ms ease;

          &:hover {
            border-color: rgba(96, 165, 250, 0.6);
            background: rgba(96, 165, 250, 0.08);
          }

          &--selected {
            border-color: #60a5fa;
            background: rgba(96, 165, 250, 0.18);
            color: #fff;
          }
        }

        &__chip-check {
          color: #60a5fa;
        }

        &__name {
          font-weight: 500;
        }

        &__pick-hint {
          margin: 0.5rem 0 0;
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.55);
          font-style: italic;
        }

        &__link {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;

          &:hover {
            color: #60a5fa;
            text-decoration: underline;
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

  @Input() selectedConnectionId: number | null = null;
  @Input() selectedRoleId: number | null = null;

  @Output() selectConnection = new EventEmitter<number>();
  @Output() selectRole = new EventEmitter<number>();

  loading = true;
  connections: AiConnectionRow[] = [];
  roles: RoleRow[] = [];

  faCheck = faCheck;
  faCircleCheck = faCircleCheck;
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
