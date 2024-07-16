import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertType } from 'src/app/shared/components/df-alert/df-alert.component';
import { DfSnackbarComponent } from 'src/app/shared/components/df-snackbar/df-snackbar.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DfSnackbarService {
  snackbarLastEle$ = new BehaviorSubject<string>('');
  isEditPage$ = new BehaviorSubject<boolean>(false);

  constructor(private snackBar: MatSnackBar) {}

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
