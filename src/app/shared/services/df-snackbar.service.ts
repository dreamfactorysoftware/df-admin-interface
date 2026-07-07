import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfSnackbarComponent } from 'src/app/shared/components/df-snackbar/df-snackbar.component';
import { BehaviorSubject } from 'rxjs';
import { AppError } from '../utilities/app-error';

const ERROR_DEDUPE_WINDOW_MS = 3000;

@Injectable({
  providedIn: 'root',
})
export class DfSnackbarService {
  snackbarLastEle$ = new BehaviorSubject<string>('');
  isEditPage$ = new BehaviorSubject<boolean>(false);
  private lastErrorToast: { key: string; at: number } | null = null;

  constructor(private snackBar: MatSnackBar) {}

  /** Error toast for a normalized AppError with a Details action; dedupes
   * identical errors within 3s so N parallel failures show one toast. */
  openError(error: AppError): void {
    const key = `${error.status}|${error.url ?? ''}|${error.message}`;
    const now = Date.now();
    if (
      this.lastErrorToast &&
      this.lastErrorToast.key === key &&
      now - this.lastErrorToast.at < ERROR_DEDUPE_WINDOW_MS
    ) {
      return;
    }
    this.lastErrorToast = { key, at: now };
    this.snackBar.openFromComponent(DfSnackbarComponent, {
      duration: 8000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
      data: {
        message: error.message,
        alertType: 'error',
        error,
      },
    });
  }

  setSnackbarLastEle(config: string, isEditPage: boolean): void {
    this.snackbarLastEle$.next(config);
    this.isEditPage$.next(isEditPage);
  }

  openSnackBar(message: string, alertType: AlertType) {
    this.snackBar.openFromComponent(DfSnackbarComponent, {
      duration: 5000,
      horizontalPosition: 'left',
      verticalPosition: 'bottom',
      data: {
        message,
        alertType,
      },
    });
  }
}
