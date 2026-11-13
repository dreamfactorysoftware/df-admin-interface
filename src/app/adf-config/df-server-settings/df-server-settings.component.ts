import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfConfirmDialogComponent } from '../../shared/components/df-confirm-dialog/df-confirm-dialog.component';
import {
  DfServerSettingsService,
  ServerSettingSaved,
} from '../../shared/services/df-server-settings.service';
import { ROUTES } from '../../shared/types/routes';
import { ServerSetting } from '../../shared/types/server-setting';

interface SettingRow {
  setting: ServerSetting;
  draft: string;
}

@Component({
  selector: 'df-server-settings',
  templateUrl: './df-server-settings.component.html',
  styleUrls: ['./df-server-settings.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    NgFor,
    NgIf,
    RouterLink,
    TranslocoPipe,
  ],
})
export class DfServerSettingsComponent implements OnInit {
  rows: SettingRow[] = [];
  loading = true;
  /** The backend has no system/server_setting (older server version). */
  unavailable = false;
  error: string | null = null;
  saved = false;
  /** Saved, but the environment refresh failed: other pages may be stale. */
  stale = false;
  systemInfoLink = `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.SYSTEM_INFO}`;

  constructor(
    private service: DfServerSettingsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.service.load().subscribe({
      next: settings => {
        if (settings === null) {
          this.unavailable = true;
        } else {
          this.rows = settings.map(setting => ({
            setting,
            draft: setting.value,
          }));
        }
        this.loading = false;
      },
      error: err => {
        // 403: an admin role saved before this feature existed has no
        // server_setting access yet.
        this.error =
          err?.status === 403
            ? 'serverSettings.forbidden'
            : 'serverSettings.loadError';
        this.loading = false;
      },
    });
  }

  canReset(row: SettingRow): boolean {
    return row.setting.source === 'override';
  }

  save(row: SettingRow) {
    this.clearStatus();
    this.service.update(row.setting.name, row.draft).subscribe({
      next: result => this.applySaved(row, result),
      error: () => {
        row.draft = row.setting.value;
        this.error = 'serverSettings.saveError';
      },
    });
  }

  reset(row: SettingRow) {
    this.clearStatus();
    this.dialog
      .open(DfConfirmDialogComponent, {
        data: {
          title: 'serverSettings.resetTitle',
          message: 'serverSettings.resetMessage',
        },
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.service.reset(row.setting.name).subscribe({
          next: result => this.applySaved(row, result),
          error: () => (this.error = 'serverSettings.saveError'),
        });
      });
  }

  private clearStatus() {
    this.error = null;
    this.saved = false;
    this.stale = false;
  }

  // The write succeeded whatever happened to the environment refresh, so the
  // row always takes the saved value; `stale` only adds a note.
  private applySaved(row: SettingRow, result: ServerSettingSaved) {
    row.setting = result.setting;
    row.draft = result.setting.value;
    this.saved = true;
    this.stale = !result.environmentRefreshed;
  }
}
