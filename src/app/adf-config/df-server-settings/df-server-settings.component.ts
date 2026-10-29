import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@ngneat/transloco';
import { DfConfirmDialogComponent } from '../../shared/components/df-confirm-dialog/df-confirm-dialog.component';
import { DfServerSettingsService } from '../../shared/services/df-server-settings.service';
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
  error: string | null = null;
  saved = false;
  systemInfoLink = `/${ROUTES.SYSTEM_SETTINGS}/${ROUTES.CONFIG}/${ROUTES.SYSTEM_INFO}`;

  constructor(
    private service: DfServerSettingsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.service.getAll().subscribe({
      next: settings => {
        this.rows = settings.map(setting => ({
          setting,
          draft: setting.value,
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'serverSettings.loadError';
        this.loading = false;
      },
    });
  }

  canReset(row: SettingRow): boolean {
    return row.setting.source === 'override';
  }

  save(row: SettingRow) {
    this.error = null;
    this.saved = false;
    this.service.update(row.setting.name, row.draft).subscribe({
      next: setting => {
        this.swap(row, setting);
        this.saved = true;
      },
      error: () => {
        row.draft = row.setting.value;
        this.error = 'serverSettings.saveError';
      },
    });
  }

  reset(row: SettingRow) {
    this.error = null;
    this.saved = false;
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
          next: setting => {
            this.swap(row, setting);
            this.saved = true;
          },
          error: () => (this.error = 'serverSettings.saveError'),
        });
      });
  }

  private swap(row: SettingRow, setting: ServerSetting) {
    row.setting = setting;
    row.draft = setting.value;
  }
}
