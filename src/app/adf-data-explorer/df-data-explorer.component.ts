import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  DataExplorerService,
  DatabaseService,
  TableInfo,
} from './services/data-explorer.service';
import { DfDbSelectorComponent } from './df-db-selector.component';
import { DfSchemaTreeComponent } from './df-schema-tree.component';
import { DfDataGridComponent } from './df-data-grid.component';
import { DfThemeService } from '../shared/services/df-theme.service';

@Component({
  selector: 'df-data-explorer',
  templateUrl: './df-data-explorer.component.html',
  styleUrls: ['./df-data-explorer.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoModule,
    FontAwesomeModule,
    DfDbSelectorComponent,
    DfSchemaTreeComponent,
    DfDataGridComponent,
  ],
})
export class DfDataExplorerComponent implements OnInit, OnDestroy {
  databases: DatabaseService[] = [];
  tables: TableInfo[] = [];
  selectedDb: DatabaseService | null = null;
  selectedTable: TableInfo | null = null;

  loadingDbs = false;
  loadingSchema = false;
  errorDbs: string | null = null;
  errorSchema: string | null = null;

  isDarkMode$ = this.themeService.darkMode$;

  private destroy$ = new Subject<void>();

  constructor(
    private dataExplorerService: DataExplorerService,
    private themeService: DfThemeService
  ) {}

  ngOnInit(): void {
    this.loadDatabases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDatabases(): void {
    this.loadingDbs = true;
    this.errorDbs = null;
    this.dataExplorerService
      .getDatabaseServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dbs => {
          this.databases = dbs;
          this.loadingDbs = false;
        },
        error: err => {
          this.errorDbs = err?.error?.error?.message || 'Failed to load databases';
          this.loadingDbs = false;
        },
      });
  }

  onDatabaseSelected(db: DatabaseService): void {
    this.selectedDb = db;
    this.selectedTable = null;
    this.tables = [];
    this.loadSchema(db.name);
  }

  loadSchema(serviceName: string): void {
    this.loadingSchema = true;
    this.errorSchema = null;
    this.dataExplorerService
      .getSchema(serviceName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tables => {
          this.tables = tables;
          this.loadingSchema = false;
        },
        error: err => {
          this.errorSchema = err?.error?.error?.message || 'Failed to load schema';
          this.loadingSchema = false;
        },
      });
  }

  onTableSelected(table: TableInfo): void {
    this.selectedTable = table;
  }

  onBackToDatabases(): void {
    this.selectedDb = null;
    this.selectedTable = null;
    this.tables = [];
  }
}
