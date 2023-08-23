import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarModule,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faXmark,
  faCheckCircle,
  faXmarkCircle,
  faExclamationCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { AlertType } from '../df-alert/df-alert.component';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'df-snackbar',
  templateUrl: './df-snackbar.component.html',
  styleUrls: ['../df-alert/df-alert.component.scss'],
  standalone: true,
  imports: [
    MatButtonModule,
    MatSnackBarModule,
    CommonModule,
    FontAwesomeModule,
    TranslateModule,
  ],
})
export class DfSnackbarComponent {
  faXmark = faXmark;
  message: string;
  alertType: AlertType = 'success';
  constructor(
    public snackBarRef: MatSnackBarRef<DfSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) {
    this.message = data.message;
    this.alertType = data.alertType;
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
