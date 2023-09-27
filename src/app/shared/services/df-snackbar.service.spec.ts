import { TestBed } from '@angular/core/testing';
import { DfSnackbarService } from './df-snackbar.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertType } from '../components/df-alert/df-alert.component';

class MatSnackBarMock {
  openFromComponent() {
    return {
      afterDismissed: () => {
        return {
          subscribe: () => {
            return;
          },
        };
      },
    };
  }
}

describe('DfSnackbarService', () => {
  let service: DfSnackbarService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DfSnackbarService,
        {
          provide: MatSnackBar,
          useClass: MatSnackBarMock,
        },
      ],
    });

    service = TestBed.inject(DfSnackbarService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open a snackBar with the provided message and alert type', () => {
    const message = 'Test message';
    const alertType: AlertType = 'success';

    jest.spyOn(snackBar, 'openFromComponent');

    service.openSnackBar(message, alertType);

    expect(snackBar.openFromComponent).toHaveBeenCalledWith(
      expect.any(Function),
      {
        duration: 5000,
        horizontalPosition: 'left',
        verticalPosition: 'bottom',
        data: {
          message,
          alertType,
        },
      }
    );
  });
});
