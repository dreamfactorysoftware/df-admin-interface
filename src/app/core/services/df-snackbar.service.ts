import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfSnackbarComponent } from 'src/app/shared/components/df-snackbar/df-snackbar.component';

@Injectable({
  providedIn: 'root',
})
export class DfSnackbarService {
  constructor(private snackBar: MatSnackBar) {}

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
