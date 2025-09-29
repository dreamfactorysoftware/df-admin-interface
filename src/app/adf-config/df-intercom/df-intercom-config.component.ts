import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { DfIntercomConfigService } from './df-intercom-config.service';
import { DfSnackbarService } from '../../shared/services/df-snackbar.service';
import { AlertType } from '../../shared/components/df-alert/df-alert.component';
import { IntercomService } from '../../shared/services/intercom.service';

@Component({
  selector: 'df-intercom-config',
  templateUrl: './df-intercom-config.component.html',
  styleUrls: ['./df-intercom-config.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
})
export class DfIntercomConfigComponent implements OnInit {
  intercomEnabled = true;
  loading = false;
  saving = false;

  constructor(
    private intercomConfigService: DfIntercomConfigService,
    private snackbarService: DfSnackbarService,
    private intercomService: IntercomService
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.intercomConfigService.getConfig().subscribe({
      next: config => {
        this.intercomEnabled = config.intercomWidget ?? true;
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load Intercom configuration:', error);
        this.snackbarService.openSnackBar(
          'Failed to load configuration',
          'error'
        );
        this.loading = false;
      },
    });
  }

  saveConfig(): void {
    this.saving = true;
    this.intercomConfigService
      .updateConfig({ intercomWidget: this.intercomEnabled })
      .subscribe({
        next: () => {
          this.snackbarService.openSnackBar(
            'Intercom configuration saved successfully',
            'success'
          );
          this.saving = false;

          // Update the Intercom widget state immediately
          if (this.intercomEnabled) {
            this.intercomService.showIntercom();
          } else {
            this.intercomService.hideIntercom();
          }
        },
        error: error => {
          console.error('Failed to save Intercom configuration:', error);
          this.snackbarService.openSnackBar(
            'Failed to save configuration',
            'error'
          );
          this.saving = false;
        },
      });
  }

  onToggleChange(): void {
    // Auto-save when toggle changes
    this.saveConfig();
  }
}
