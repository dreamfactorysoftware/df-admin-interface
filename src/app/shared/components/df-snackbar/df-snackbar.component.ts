import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertType } from '../df-alert/df-alert.component';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faXmark,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TranslocoPipe } from '@ngneat/transloco';
import { NgIf } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppError } from '../../utilities/app-error';
import { DfErrorDetailDialogComponent } from '../df-error-detail/df-error-detail-dialog.component';

@Component({
  selector: 'df-snackbar',
  templateUrl: './df-snackbar.component.html',
  styleUrls: ['./df-snackbar.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    FontAwesomeModule,
    TranslocoPipe,
    NgIf,
    MatDialogModule,
  ],
})
export class DfSnackbarComponent {
  faXmark = faXmark;
  message: string;
  alertType: AlertType = 'success';
  error: AppError | null = null;
  constructor(
    public snackBarRef: MatSnackBarRef<DfSnackbarComponent>,
    private dialog: MatDialog,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) {
    this.message = data.message;
    this.alertType = data.alertType;
    this.error = data.error ?? null;
  }

  openDetails(): void {
    this.dialog.open(DfErrorDetailDialogComponent, {
      data: { error: this.error },
      maxWidth: '640px',
    });
    this.snackBarRef.dismiss();
  }

  get icon(): IconProp {
    switch (this.alertType) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faXmarkCircle;
      case 'warning':
        return faExclamationCircle;
      case 'info':
        return faInfoCircle;
      default:
        return faInfoCircle;
    }
  }

  onAction(): void {
    this.snackBarRef.dismissWithAction();
  }
}
