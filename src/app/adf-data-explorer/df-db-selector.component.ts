import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@ngneat/transloco';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { DatabaseService } from './services/data-explorer.service';

@Component({
  selector: 'df-db-selector',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoModule,
    FontAwesomeModule,
  ],
  template: `
    <div class="db-selector" *transloco="let t; scope: 'dataExplorer'">
      <div class="panel-header">
        <mat-icon class="header-icon">storage</mat-icon>
        <span class="header-title">{{ t('dataExplorer.database') }}</span>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="32"></mat-spinner>
        <span>{{ t('dataExplorer.loading') }}</span>
      </div>

      <!-- Error -->
      <div class="error-state" *ngIf="error && !loading">
        <mat-icon color="warn">error_outline</mat-icon>
        <span>{{ error | transloco }}</span>
        <button mat-stroked-button color="primary" (click)="retry.emit()">
          {{ t('dataExplorer.retry') }}
        </button>
      </div>

      <!-- Empty -->
      <div
        class="empty-state"
        *ngIf="!loading && !error && databases.length === 0">
        <mat-icon>info_outline</mat-icon>
        <span>{{ t('dataExplorer.noDatabases') }}</span>
        <small>{{ t('dataExplorer.noDatabasesHint') }}</small>
      </div>

      <!-- Search: only worth the space once the list is long -->
      <div
        class="db-search"
        *ngIf="!loading && !error && databases.length > searchThreshold">
        <mat-icon class="db-search-icon">search</mat-icon>
        <input
          type="search"
          [placeholder]="t('dataExplorer.searchDatabases')"
          [attr.aria-label]="t('dataExplorer.searchDatabases')"
          (input)="onSearch($event)" />
      </div>

      <!-- Database list -->
      <mat-nav-list
        *ngIf="!loading && !error && databases.length > 0"
        class="db-list">
        <a
          mat-list-item
          *ngFor="let db of filtered; trackBy: trackByDbName"
          tabindex="0"
          (click)="databaseSelected.emit(db)"
          (keyup.enter)="databaseSelected.emit(db)"
          [matTooltip]="tooltipFor(db)"
          matTooltipPosition="right"
          class="db-item">
          <fa-icon [icon]="faDatabase" class="db-icon"></fa-icon>
          <div class="db-info">
            <span class="db-name">{{ db.name }}</span>
            <span class="db-type">{{ db.typeLabel || db.type }}</span>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </a>
        <div class="no-matches" *ngIf="filtered.length === 0">
          {{ t('dataExplorer.noMatches') }}
        </div>
      </mat-nav-list>
    </div>
  `,
  styles: [
    `
      .db-selector {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 16px;
        height: 49px;
        box-sizing: border-box;
        border-bottom: 1px solid var(--df-border);
        font-weight: 600;
        font-size: 1.4rem;
        letter-spacing: -0.01em;
        color: var(--df-text);

        .header-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: var(--df-accent);
        }
      }

      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 32px 16px;
        text-align: center;
        color: var(--df-text-muted);
        font-size: 1.3rem;
      }

      .db-search {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-bottom: 1px solid var(--df-border);

        .db-search-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: var(--df-text-muted);
        }

        input {
          flex: 1;
          min-width: 0;
          border: 0;
          background: transparent;
          color: var(--df-text);
          font: inherit;
          font-size: 1.3rem;
          outline: none;

          &::placeholder {
            color: var(--df-text-muted);
          }
        }
      }

      .db-list {
        flex: 1;
        overflow-y: auto;
        padding-top: 4px;
      }

      .no-matches {
        padding: 24px 16px;
        text-align: center;
        color: var(--df-text-muted);
        font-size: 1.3rem;
      }

      .db-item {
        height: 56px !important;
        padding: 0 16px !important;
        cursor: pointer;

        ::ng-deep .mdc-list-item__primary-text {
          display: flex !important;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .db-icon {
          color: var(--df-accent);
          font-size: 16px;
          flex-shrink: 0;
          pointer-events: none;
        }

        .db-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          pointer-events: none;

          .db-name {
            font-size: 1.4rem;
            font-weight: 500;
            color: var(--df-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .db-type {
            font-size: 11px;
            color: var(--df-text-muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .chevron {
          color: var(--df-text-faint);
          flex-shrink: 0;
          pointer-events: none;
        }

        &:hover {
          background: var(--df-hover);
        }
      }
    `,
  ],
})
export class DfDbSelectorComponent {
  @Input() databases: DatabaseService[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() databaseSelected = new EventEmitter<DatabaseService>();
  @Output() retry = new EventEmitter<void>();

  faDatabase = faDatabase;

  /** Below this many services a search box is just noise. */
  readonly searchThreshold = 8;
  query = '';

  get filtered(): DatabaseService[] {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      return this.databases;
    }
    return this.databases.filter(db =>
      [db.name, db.label, db.typeLabel, db.type].some(v =>
        (v ?? '').toLowerCase().includes(q)
      )
    );
  }

  onSearch(event: Event): void {
    this.query = (event.target as HTMLInputElement).value;
  }

  /** The hover text carries what the row does not: description, then a label that differs from the name. */
  tooltipFor(db: DatabaseService): string {
    if (db.description) {
      return db.description;
    }
    return db.label && db.label !== db.name ? db.label : db.name;
  }

  trackByDbName(_index: number, db: DatabaseService): string {
    return db.name;
  }
}
